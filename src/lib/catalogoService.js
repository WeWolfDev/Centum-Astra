// Cursos, grupos y módulos que administra el panel (#50). Solo el administrador
// escribe (RLS); se archiva con status en lugar de borrar.
import { supabase } from './supabaseClient';

const LOAD_ERROR = 'No pudimos cargar los cursos. Intenta de nuevo.';
const ACTION_ERROR = 'No se pudo guardar. Intenta de nuevo.';
const PERMISSION_DENIED = '42501';
const UNIQUE_VIOLATION = '23505';
const CHECK_VIOLATION = '23514';

// Horarios que definió el cliente; el campo acepta cualquier otro.
export const HORARIOS_SUGERIDOS = [
  'Entre semana: martes y jueves, 7:00 a 9:00 p. m.',
  'Sabatino: sábados, 8:00 a. m. a 12:00 p. m.',
];

const TABLAS = ['courses', 'groups', 'modules'];
const ESTADOS = ['active', 'archived'];

function mensajeDeError(error, duplicado = ACTION_ERROR) {
  if (error?.code === PERMISSION_DENIED) return 'No tienes permiso para hacer este cambio.';
  if (error?.code === UNIQUE_VIOLATION) return duplicado;
  if (error?.code === CHECK_VIOLATION) return 'Revisa los datos: hay un valor que no es válido.';
  return ACTION_ERROR;
}

async function ejecutar(consulta, duplicado) {
  const { error } = await consulta;
  if (error) throw new Error(mensajeDeError(error, duplicado));
}

function texto(valor) {
  const limpio = (valor ?? '').trim();
  return limpio || null;
}

function exigir(valor, mensaje) {
  const limpio = texto(valor);
  if (!limpio) throw new Error(mensaje);
  return limpio;
}

const ahora = () => new Date().toISOString();

// ── Lectura ──────────────────────────────────────────────────────────────────

function toCatalogCourse(curso) {
  return {
    id: curso.id,
    name: curso.name,
    description: curso.description ?? '',
    status: curso.status,
    startsOn: curso.starts_on ?? '',
    endsOn: curso.ends_on ?? '',
    groups: [...(curso.groups ?? [])]
      .sort((a, b) => a.name.localeCompare(b.name, 'es'))
      .map(g => ({ id: g.id, name: g.name, code: g.code, schedule: g.schedule ?? '', status: g.status })),
    modules: [...(curso.modules ?? [])]
      .sort((a, b) => a.position - b.position)
      .map(m => ({ id: m.id, title: m.title, description: m.description ?? '', position: m.position, status: m.status })),
  };
}

/** @param {{ includeArchived?: boolean }} [opciones] */
export async function listCatalog({ includeArchived = false } = {}) {
  const { data, error } = await supabase
    .from('courses')
    .select(
      'id, name, description, status, starts_on, ends_on, ' +
      'groups(id, name, code, schedule, status), modules(id, title, description, position, status)',
    )
    .order('name');
  if (error) throw new Error(LOAD_ERROR);

  const cursos = data.map(toCatalogCourse);
  if (includeArchived) return cursos;
  return cursos
    .filter(c => c.status === 'active')
    .map(c => ({
      ...c,
      groups: c.groups.filter(g => g.status === 'active'),
      modules: c.modules.filter(m => m.status === 'active'),
    }));
}

// ── Cursos ───────────────────────────────────────────────────────────────────

function datosCurso({ name, description, startsOn, endsOn }) {
  const inicio = texto(startsOn);
  const fin = texto(endsOn);
  if (inicio && fin && fin < inicio) throw new Error('La fecha de fin no puede ser anterior a la de inicio.');
  return {
    name: exigir(name, 'Escribe el nombre del curso.'),
    description: texto(description),
    starts_on: inicio,
    ends_on: fin,
  };
}

export async function createCourse(curso) {
  const fila = datosCurso(curso);
  return ejecutar(supabase.from('courses').insert(fila));
}

export async function updateCourse(id, curso) {
  const cambios = { ...datosCurso(curso), updated_at: ahora() };
  return ejecutar(supabase.from('courses').update(cambios).eq('id', id));
}

// ── Grupos ───────────────────────────────────────────────────────────────────

const GRUPO_DUPLICADO = 'Ya existe un grupo con ese código en este curso.';

function datosGrupo({ name, code, schedule }) {
  return {
    name: exigir(name, 'Escribe el nombre del grupo.'),
    code: exigir(code, 'Escribe el código del grupo.'),
    schedule: exigir(schedule, 'Escribe el horario del grupo.'),
  };
}

export async function createGroup({ courseId, ...grupo }) {
  const fila = { course_id: courseId, ...datosGrupo(grupo) };
  return ejecutar(supabase.from('groups').insert(fila), GRUPO_DUPLICADO);
}

export async function updateGroup(id, grupo) {
  const cambios = { ...datosGrupo(grupo), updated_at: ahora() };
  return ejecutar(supabase.from('groups').update(cambios).eq('id', id), GRUPO_DUPLICADO);
}

// ── Módulos ──────────────────────────────────────────────────────────────────

function datosModulo({ title, description }) {
  return {
    title: exigir(title, 'Escribe el título del módulo.'),
    description: texto(description),
  };
}

async function siguientePosicion(courseId) {
  const { data, error } = await supabase
    .from('modules')
    .select('position')
    .eq('course_id', courseId)
    .order('position', { ascending: false })
    .limit(1);
  if (error) throw new Error(mensajeDeError(error));
  return data.length > 0 ? data[0].position + 1 : 0;
}

// El módulo nuevo va al final. Si otra persona tomó esa posición al mismo
// tiempo, (course_id, position) es único y se reintenta una vez.
export async function createModule({ courseId, ...modulo }) {
  const fila = { course_id: courseId, ...datosModulo(modulo) };
  for (let intento = 0; intento < 2; intento += 1) {
    const position = await siguientePosicion(courseId);
    const { error } = await supabase.from('modules').insert({ ...fila, position });
    if (!error) return;
    if (error.code !== UNIQUE_VIOLATION || intento === 1) throw new Error(mensajeDeError(error));
  }
}

export async function updateModule(id, modulo) {
  const cambios = { ...datosModulo(modulo), updated_at: ahora() };
  return ejecutar(supabase.from('modules').update(cambios).eq('id', id));
}

// ── Archivar y reactivar ─────────────────────────────────────────────────────

/**
 * @param {'courses' | 'groups' | 'modules'} tabla
 * @param {string} id
 * @param {'active' | 'archived'} status
 */
export async function setStatus(tabla, id, status) {
  if (!TABLAS.includes(tabla) || !ESTADOS.includes(status)) throw new Error(ACTION_ERROR);
  return ejecutar(supabase.from(tabla).update({ status, updated_at: ahora() }).eq('id', id));
}
