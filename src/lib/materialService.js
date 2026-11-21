// Clases y material de cada módulo (#34). RLS decide quién lee y escribe:
// el maestro publica y corrige lo suyo; solo el administrador retira.
// Los archivos (PDF, Word) esperan a Storage (#28); por ahora solo enlaces.
import { supabase } from './supabaseClient';

const LOAD_ERROR = 'No pudimos cargar el material. Intenta de nuevo.';
const ACTION_ERROR = 'No se pudo guardar. Intenta de nuevo.';
const PERMISSION_DENIED = '42501';
const CHECK_VIOLATION = '23514';

export const TIPOS_ENLACE = [
  { valor: 'video_link', etiqueta: 'Video' },
  { valor: 'external_link', etiqueta: 'Página o documento en línea' },
];

function mensajeDeError(error) {
  if (error?.code === PERMISSION_DENIED) return 'No tienes permiso para hacer este cambio.';
  if (error?.code === CHECK_VIOLATION) return 'Revisa los datos: hay un valor que no es válido.';
  return ACTION_ERROR;
}

async function ejecutar(consulta) {
  const { error } = await consulta;
  if (error) throw new Error(mensajeDeError(error));
}

function exigir(valor, mensaje) {
  const limpio = (valor ?? '').trim();
  if (!limpio) throw new Error(mensaje);
  return limpio;
}

// Solo http(s): un enlace javascript: o data: no debe llegar a los alumnos.
export function enlaceSeguro(url) {
  try {
    const parsed = new URL((url ?? '').trim());
    return ['http:', 'https:'].includes(parsed.protocol) ? parsed.href : null;
  } catch {
    return null;
  }
}

// ── Lectura ──────────────────────────────────────────────────────────────────

/** Cursos activos con sus módulos activos. Al maestro, RLS le deja solo los suyos. */
export async function listMaterialCourses() {
  const { data, error } = await supabase
    .from('courses')
    .select('id, name, status, modules(id, title, position, status)')
    .eq('status', 'active')
    .order('name');
  if (error) throw new Error(LOAD_ERROR);
  return data.map(curso => ({
    id: curso.id,
    name: curso.name,
    modules: (curso.modules ?? [])
      .filter(m => m.status === 'active')
      .sort((a, b) => a.position - b.position)
      .map(m => ({ id: m.id, title: m.title })),
  }));
}

function toMaterial(m) {
  return { id: m.id, title: m.title, kind: m.kind, url: m.external_url, status: m.status, createdBy: m.created_by };
}

/**
 * Clases activas del módulo con su material vigente. `nextPosition` cuenta
 * también las archivadas, porque la posición es única por módulo.
 */
export async function listModuleSessions(moduleId) {
  const { data, error } = await supabase
    .from('sessions')
    .select('id, title, position, status, materials(id, title, kind, external_url, status, created_by, created_at)')
    .eq('module_id', moduleId)
    .order('position');
  if (error) throw new Error(LOAD_ERROR);
  const nextPosition = data.reduce((max, s) => Math.max(max, s.position + 1), 0);
  const sessions = data
    .filter(s => s.status === 'active')
    .map(s => ({
      id: s.id,
      title: s.title,
      materials: [...(s.materials ?? [])]
        .filter(m => m.status !== 'archived')
        .sort((a, b) => a.created_at.localeCompare(b.created_at))
        .map(toMaterial),
    }));
  return { sessions, nextPosition };
}

// ── Escritura ────────────────────────────────────────────────────────────────

export async function createSession(moduleId, title, position) {
  const nombre = exigir(title, 'Agrega un nombre a la clase.');
  return ejecutar(supabase.from('sessions').insert({ module_id: moduleId, title: nombre, position }));
}

export async function renameSession(sessionId, title) {
  const nombre = exigir(title, 'Agrega un nombre a la clase.');
  return ejecutar(
    supabase.from('sessions').update({ title: nombre, updated_at: new Date().toISOString() }).eq('id', sessionId),
  );
}

export async function archiveSession(sessionId) {
  return ejecutar(
    supabase.from('sessions').update({ status: 'archived', updated_at: new Date().toISOString() }).eq('id', sessionId),
  );
}

/** El maestro publica sin aprobación previa (decisión del cliente, 1.8). */
export async function addLink(sessionId, { title, url, kind }, userId) {
  const titulo = exigir(title, 'Agrega un título.');
  const enlace = enlaceSeguro(url);
  if (!enlace) throw new Error('Escribe un enlace válido que empiece con https://');
  if (!TIPOS_ENLACE.some(t => t.valor === kind)) throw new Error('Elige el tipo de enlace.');
  const ahora = new Date().toISOString();
  return ejecutar(
    supabase.from('materials').insert({
      session_id: sessionId,
      title: titulo,
      kind,
      external_url: enlace,
      status: 'published',
      created_by: userId,
      published_by: userId,
      published_at: ahora,
    }),
  );
}

/** Solo el administrador retira material publicado (RLS y trigger). */
export async function retireMaterial(materialId) {
  return ejecutar(
    supabase.from('materials').update({ status: 'archived', updated_at: new Date().toISOString() }).eq('id', materialId),
  );
}
