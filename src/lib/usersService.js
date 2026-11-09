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

export function filterUsers(users, { search = '', role = 'all' } = {}) {
  const termino = search.trim().toLowerCase();
  return users.filter(u => {
    if (role !== 'all' && u.role !== role) return false;
    if (!termino) return true;
    return u.name.toLowerCase().includes(termino) || u.email.toLowerCase().includes(termino);
  });
}

export async function listUsers() {
  const { data, error } = await supabase
    .from('profiles')
    .select(USER_COLUMNS)
    .order('full_name');
  if (error) throw new Error(LOAD_ERROR);
  return data.map(toUserRow);
}

// RLS limita el resultado a los alumnos de los grupos del profesor.
export async function listMyStudents() {
  const { data, error } = await supabase
    .from('profiles')
    .select(USER_COLUMNS)
    .eq('role', 'student')
    .order('full_name');
  if (error) throw new Error(LOAD_ERROR);
  return data.map(toUserRow);
}

export async function listGroups() {
  const { data, error } = await supabase
    .from('groups')
    .select('id, name, code, course_id, courses(name)')
    .eq('status', 'active')
    .order('name');
  if (error) throw new Error(LOAD_ERROR);
  return data.map(g => ({
    id: g.id,
    name: g.name,
    code: g.code,
    courseId: g.course_id,
    course: g.courses?.name ?? '',
  }));
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
