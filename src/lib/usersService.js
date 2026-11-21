// Acceso a cuentas y grupos. Las lecturas pasan por RLS; los cambios de cuenta,
// por la Edge Function admin-users.
import { supabase } from './supabaseClient';

const LOAD_ERROR = 'No pudimos cargar la información. Intenta de nuevo.';
const ACTION_ERROR = 'No se pudo completar la acción. Intenta de nuevo.';

const USER_COLUMNS =
  'id, full_name, email, role, status, created_at, ' +
  'group_students(group_id, groups(name)), group_teachers(group_id, groups(name))';

// PostgREST devuelve un objeto, no un arreglo, en relaciones 1 a 1
// (group_students tiene unique(student_id)).
function comoLista(valor) {
  if (!valor) return [];
  return Array.isArray(valor) ? valor : [valor];
}

export function toUserRow(profile) {
  const asignaciones = [...comoLista(profile.group_students), ...comoLista(profile.group_teachers)];
  return {
    id: profile.id,
    name: profile.full_name?.trim() || profile.email,
    email: profile.email,
    role: profile.role,
    status: profile.status,
    createdAt: profile.created_at,
    groups: asignaciones.map(a => ({ id: a.group_id, name: a.groups?.name ?? 'Grupo' })),
  };
}

export const PAGE_SIZE = 25;
const RECENT_LIMIT = 4;
const GROUPS_BATCH = 1000;
const OUT_OF_RANGE = 'PGRST103';

// Escapa los comodines de ilike y luego las comillas del filtro .or() de PostgREST.
function patronBusqueda(search) {
  const literal = search.trim().replace(/[\\%_]/g, '\\$&');
  return `"%${literal.replace(/[\\"]/g, '\\$&')}%"`;
}

function aplicarFiltros(consulta, { search = '', role = 'all' }) {
  let filtrada = consulta;
  if (role !== 'all') filtrada = filtrada.eq('role', role);
  if (search.trim()) {
    const patron = patronBusqueda(search);
    filtrada = filtrada.or(`full_name.ilike.${patron},email.ilike.${patron}`);
  }
  return filtrada;
}

// Una página de cuentas con el total real que cuenta el servidor, no el de la página.
async function leerPagina(consulta, { page = 0 } = {}) {
  const desde = page * PAGE_SIZE;
  const { data, count, error } = await consulta
    .order('full_name')
    .order('id')
    .range(desde, desde + PAGE_SIZE - 1);
  if (error?.code === OUT_OF_RANGE) return { users: [], total: 0, outOfRange: true };
  if (error) throw new Error(LOAD_ERROR);
  return { users: data.map(toUserRow), total: count ?? 0, outOfRange: false };
}

export function listUsers({ search, role, page } = {}) {
  const consulta = supabase.from('profiles').select(USER_COLUMNS, { count: 'exact' });
  return leerPagina(aplicarFiltros(consulta, { search, role }), { page });
}

// RLS limita el resultado a los alumnos de los grupos del profesor.
export function listMyStudents({ search, page } = {}) {
  const consulta = supabase.from('profiles').select(USER_COLUMNS, { count: 'exact' }).eq('role', 'student');
  return leerPagina(aplicarFiltros(consulta, { search }), { page });
}

async function contar(tabla, { eq = [], neq = [] }) {
  let consulta = supabase.from(tabla).select('id', { count: 'exact', head: true });
  for (const [columna, valor] of eq) consulta = consulta.eq(columna, valor);
  for (const [columna, valor] of neq) consulta = consulta.neq(columna, valor);
  const { count, error } = await consulta;
  if (error) throw new Error(LOAD_ERROR);
  return count ?? 0;
}

// Cifras del resumen del administrador, contadas en el servidor.
export async function getDirectorySummary() {
  const [totalStudents, activeStudents, activeTeachers, activeGroups, recent] = await Promise.all([
    contar('profiles', { eq: [['role', 'student']], neq: [['status', 'deleted']] }),
    contar('profiles', { eq: [['role', 'student'], ['status', 'active']] }),
    contar('profiles', { eq: [['role', 'teacher'], ['status', 'active']] }),
    contar('groups', { eq: [['status', 'active']] }),
    supabase.from('profiles').select(USER_COLUMNS).order('created_at', { ascending: false }).limit(RECENT_LIMIT),
  ]);
  if (recent.error) throw new Error(LOAD_ERROR);
  return { totalStudents, activeStudents, activeTeachers, activeGroups, recent: recent.data.map(toUserRow) };
}

function toGroup(g) {
  return { id: g.id, name: g.name, code: g.code, courseId: g.course_id, course: g.courses?.name ?? '' };
}

// PostgREST corta cada respuesta en 1000 filas: se leen lotes hasta agotarlos.
export async function listGroups() {
  const grupos = [];
  for (let desde = 0; ; desde += GROUPS_BATCH) {
    const { data, error } = await supabase
      .from('groups')
      .select('id, name, code, course_id, courses(name)')
      .eq('status', 'active')
      .order('name')
      .order('id')
      .range(desde, desde + GROUPS_BATCH - 1);
    if (error) throw new Error(LOAD_ERROR);
    grupos.push(...data.map(toGroup));
    if (data.length < GROUPS_BATCH) return grupos;
  }
}

async function mensajeDeFuncion(error) {
  try {
    const cuerpo = await error.context.json();
    return cuerpo?.error || ACTION_ERROR;
  } catch {
    return ACTION_ERROR;
  }
}

export async function runAdminAction(action, payload) {
  const { data, error } = await supabase.functions.invoke('admin-users', {
    body: { action, ...payload },
  });
  if (error) throw new Error(await mensajeDeFuncion(error));
  return data;
}

async function asignarAlumno(userId, groupId) {
  const consulta = groupId
    ? supabase
      .from('group_students')
      .upsert({ group_id: groupId, student_id: userId }, { onConflict: 'student_id' })
    : supabase.from('group_students').delete().eq('student_id', userId);
  const { error } = await consulta;
  if (error) throw new Error(ACTION_ERROR);
}

async function asignarProfesor(userId, actuales, nuevos) {
  const retirar = actuales.filter(id => !nuevos.includes(id));
  const agregar = nuevos.filter(id => !actuales.includes(id));
  if (retirar.length > 0) {
    const { error } = await supabase
      .from('group_teachers')
      .delete()
      .eq('teacher_id', userId)
      .in('group_id', retirar);
    if (error) throw new Error(ACTION_ERROR);
  }
  if (agregar.length > 0) {
    const { error } = await supabase
      .from('group_teachers')
      .insert(agregar.map(group_id => ({ group_id, teacher_id: userId })));
    if (error) throw new Error(ACTION_ERROR);
  }
}

export async function setUserGroups(user, groupIds) {
  if (user.role === 'student') return asignarAlumno(user.id, groupIds[0] ?? null);
  if (user.role === 'teacher') return asignarProfesor(user.id, user.groups.map(g => g.id), groupIds);
  throw new Error('Solo alumnos y profesores se asignan a grupos.');
}
