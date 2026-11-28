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
      .map(g => ({ id: g.id, name: g.name, code: g.code, schedule: g.schedule ?? '', generation: g.generation ?? '', status: g.status })),
    modules: [...(curso.modules ?? [])]
      .sort((a, b) => a.position - b.position)
      .map(m => ({
        id: m.id, title: m.title, description: m.description ?? '', position: m.position, status: m.status,
        imagePath: m.image_path ?? null, imageUrl: imagenModuloUrl(m.image_path),
      })),
  };
}

/** @param {{ includeArchived?: boolean }} [opciones] */
export async function listCatalog({ includeArchived = false } = {}) {
  const { data, error } = await supabase
    .from('courses')
    .select(
      'id, name, description, status, starts_on, ends_on, ' +
      'groups(id, name, code, schedule, generation, status), modules(id, title, description, position, status, image_path)',
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

const GENERACION_MAX = 60;

function datosGrupo({ name, code, schedule, generation }) {
  const generacion = texto(generation);
  if (generacion && generacion.length > GENERACION_MAX) {
    throw new Error(`La generación admite hasta ${GENERACION_MAX} caracteres.`);
  }
  return {
    name: exigir(name, 'Escribe el nombre del grupo.'),
    code: exigir(code, 'Escribe el código del grupo.'),
    schedule: exigir(schedule, 'Escribe el horario del grupo.'),
    generation: generacion,
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

// ── Imagen del módulo ────────────────────────────────────────────────────────
// Sin imagen propia, la pantalla usa la del área (src/config/areas.js).

const BUCKET_MODULOS = 'modulos';
export const TIPOS_IMAGEN_MODULO = ['image/jpeg', 'image/png', 'image/webp'];
export const MAX_IMAGEN_MODULO_BYTES = 5 * 1024 * 1024;

/** URL pública de la imagen del módulo, o null si no tiene. */
export function imagenModuloUrl(path) {
  if (!path) return null;
  return supabase.storage.from(BUCKET_MODULOS).getPublicUrl(path).data.publicUrl;
}

export function validarImagenModulo(archivo) {
  if (!TIPOS_IMAGEN_MODULO.includes(archivo.type)) throw new Error('La imagen debe ser JPG, PNG o WebP.');
  if (archivo.size > MAX_IMAGEN_MODULO_BYTES) throw new Error('La imagen pesa más de 5 MB.');
}

/**
 * Sube una imagen nueva (`archivo`) o quita la actual (`quitar`). Cada imagen
 * va con un nombre nuevo para que el navegador no muestre la anterior en caché;
 * la anterior se borra al final y, si falla el borrado, solo queda ocupando espacio.
 */
export async function cambiarImagenModulo(moduleId, { archivo = null, quitar = false, anterior = null } = {}) {
  if (!archivo && !quitar) return;
  let nueva = null;
  if (archivo) {
    validarImagenModulo(archivo);
    const extension = archivo.type.split('/')[1].replace('jpeg', 'jpg');
    nueva = `${moduleId}/${Date.now()}.${extension}`;
    const { error } = await supabase.storage
      .from(BUCKET_MODULOS)
      .upload(nueva, archivo, { contentType: archivo.type, upsert: false });
    if (error) throw new Error('No se pudo subir la imagen. Intenta de nuevo.');
  }
  const { error } = await supabase.from('modules').update({ image_path: nueva, updated_at: ahora() }).eq('id', moduleId);
  if (error) {
    if (nueva) await supabase.storage.from(BUCKET_MODULOS).remove([nueva]);
    throw new Error(mensajeDeError(error));
  }
  if (anterior) await supabase.storage.from(BUCKET_MODULOS).remove([anterior]);
}

// El módulo nuevo va al final. Si otra persona tomó esa posición al mismo
// tiempo, (course_id, position) es único y se reintenta una vez.
export async function createModule({ courseId, ...modulo }) {
  const fila = { course_id: courseId, ...datosModulo(modulo) };
  for (let intento = 0; intento < 2; intento += 1) {
    const position = await siguientePosicion(courseId);
    const { data, error } = await supabase.from('modules').insert({ ...fila, position }).select('id').single();
    if (!error) return data?.id;
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
