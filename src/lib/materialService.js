// Clases y material de cada módulo (#34). RLS decide quién lee y escribe:
// el maestro publica y corrige lo suyo; solo el administrador retira.
// Los archivos viven en el bucket privado `materiales` (#28): primero se
// registra el borrador, luego se sube el objeto y al final se confirma.
import { supabase } from './supabaseClient';

const LOAD_ERROR = 'No pudimos cargar el material. Intenta de nuevo.';
const ACTION_ERROR = 'No se pudo guardar. Intenta de nuevo.';
const PERMISSION_DENIED = '42501';
const CHECK_VIOLATION = '23514';
const FILE_NOT_CONFIRMED = 'CA002';
const EXECUTABLE_FILE = 'CA003';
const FILE_UNAVAILABLE = 'CA004';
const TOPIC_NOT_EMPTY = 'CA031';

const BUCKET = 'materiales';
export const MAX_FILE_BYTES = 50 * 1024 * 1024;
const SIGNED_URL_SECONDS = 300;

// Misma lista que app_private.is_executable_name; la base es la que decide.
const EXTENSIONES_EJECUTABLES = new Set([
  'exe', 'msi', 'msp', 'msix', 'msixbundle', 'appx', 'appxbundle', 'bat', 'cmd',
  'com', 'scr', 'pif', 'cpl', 'gadget', 'hta', 'lnk', 'scf', 'reg', 'ps1', 'psm1',
  'vbs', 'vbe', 'js', 'jse', 'ws', 'wsf', 'wsh', 'sh', 'bash', 'command', 'app',
  'dmg', 'pkg', 'deb', 'rpm', 'apk', 'jar', 'dll', 'so', 'elf', 'run', 'bin',
]);

export const TIPOS_ENLACE = [
  { valor: 'video_link', etiqueta: 'Video' },
  { valor: 'external_link', etiqueta: 'Página o documento en línea' },
];

function mensajeDeError(error) {
  if (error?.code === PERMISSION_DENIED) return 'No tienes permiso para hacer este cambio.';
  if (error?.code === CHECK_VIOLATION) return 'Revisa los datos: hay un valor que no es válido.';
  if (error?.code === EXECUTABLE_FILE) return 'No se permiten archivos ejecutables.';
  if (error?.code === FILE_NOT_CONFIRMED) return 'El archivo no terminó de subirse. Intenta de nuevo.';
  if (error?.code === FILE_UNAVAILABLE) return 'Este archivo ya no está disponible.';
  if (error?.code === TOPIC_NOT_EMPTY) return 'Mueve o retira sus clases antes de archivar el tema.';
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
  return {
    id: m.id,
    title: m.title,
    kind: m.kind,
    url: m.external_url,
    status: m.status,
    createdBy: m.created_by,
    storagePath: m.storage_path ?? undefined,
    fileName: m.file_name ?? undefined,
    fileSize: m.file_size ?? undefined,
    fileVersion: m.file_version ?? undefined,
  };
}

/**
 * Temas activos del módulo con sus clases activas y su material vigente.
 * `sessions` sigue plano para quien no agrupa por tema. `nextPosition` cuenta
 * también las clases archivadas, porque la posición es única por módulo.
 */
export async function listModuleSessions(moduleId) {
  const [temas, clases] = await Promise.all([
    supabase.from('topics').select('id, title, position, status').eq('module_id', moduleId).order('position'),
    supabase
      .from('sessions')
      .select('id, title, position, status, topic_id, materials(id, title, kind, external_url, storage_path, file_name, file_size, file_version, status, created_by, created_at)')
      .eq('module_id', moduleId)
      .order('position'),
  ]);
  if (temas.error || clases.error) throw new Error(LOAD_ERROR);

  const nextPosition = clases.data.reduce((max, s) => Math.max(max, s.position + 1), 0);
  const nextTopicPosition = temas.data.reduce((max, t) => Math.max(max, t.position + 1), 0);
  const sessions = clases.data
    .filter(s => s.status === 'active')
    .map(s => ({
      id: s.id,
      title: s.title,
      topicId: s.topic_id,
      materials: [...(s.materials ?? [])]
        .filter(m => m.status !== 'archived')
        .sort((a, b) => a.created_at.localeCompare(b.created_at))
        .map(toMaterial),
    }));
  const topics = temas.data
    .filter(t => t.status === 'active')
    .sort((a, b) => a.position - b.position || a.title.localeCompare(b.title, 'es'))
    .map(t => ({ id: t.id, title: t.title, sessions: sessions.filter(s => s.topicId === t.id) }));
  return { topics, sessions, nextPosition, nextTopicPosition };
}

// ── Escritura ────────────────────────────────────────────────────────────────

/** Sin `topicId`, la base la deja en el tema General del módulo. */
export async function createSession(moduleId, title, position, topicId = null) {
  const nombre = exigir(title, 'Agrega un nombre a la clase.');
  return ejecutar(
    supabase.from('sessions').insert({ module_id: moduleId, title: nombre, position, topic_id: topicId }),
  );
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

// ── Temas ────────────────────────────────────────────────────────────────────

export async function createTopic({ courseId, moduleId }, title, position) {
  const nombre = exigir(title, 'Agrega un nombre al tema.');
  return ejecutar(
    supabase.from('topics').insert({ course_id: courseId, module_id: moduleId, title: nombre, position }),
  );
}

export async function renameTopic(topicId, title) {
  const nombre = exigir(title, 'Agrega un nombre al tema.');
  return ejecutar(
    supabase.from('topics').update({ title: nombre, updated_at: new Date().toISOString() }).eq('id', topicId),
  );
}

/** La base lo rechaza (CA031) si el tema todavía tiene clases activas. */
export async function archiveTopic(topicId) {
  return ejecutar(
    supabase.from('topics').update({ status: 'archived', updated_at: new Date().toISOString() }).eq('id', topicId),
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

// ── Archivos ─────────────────────────────────────────────────────────────────

// Igual que en la base: Windows quita puntos y espacios finales al guardar,
// así que `virus.exe.` cuenta como `.exe`.
function extension(nombre) {
  const match = /\.([^./]+)$/.exec((nombre ?? '').replace(/[. ]+$/, ''));
  return match ? match[1].toLowerCase() : '';
}

export function esEjecutable(nombre) {
  return EXTENSIONES_EJECUTABLES.has(extension(nombre));
}

/** Storage solo acepta ciertos caracteres en la ruta: se quitan acentos y espacios. */
export function nombreSeguro(nombre) {
  const limpio = (nombre ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9._-]+/g, '-')
    .replace(/^[-.]+|[-.]+$/g, '');
  return limpio || 'archivo';
}

/**
 * Motivo por el que el archivo no se puede subir, o null. Con `rutaAnterior`
 * exige su misma extensión: el reemplazo conserva el nombre y un Word guardado
 * como `guia.pdf` no abre. La pantalla lo usa para avisar antes de enviar.
 */
export function problemaDeArchivo(file, rutaAnterior) {
  if (!file) return 'Elige un archivo.';
  if (file.size > MAX_FILE_BYTES) return 'El archivo pesa más de 50 MB.';
  if (esEjecutable(file.name)) return 'No se permiten archivos ejecutables.';
  if (rutaAnterior === undefined) return null;
  const esperada = extension(rutaAnterior);
  if (extension(file.name) === esperada) return null;
  return esperada
    ? `El archivo nuevo debe ser .${esperada}, igual que el anterior.`
    : 'El archivo nuevo debe tener el mismo formato que el anterior.';
}

function validarArchivo(file, rutaAnterior) {
  const problema = problemaDeArchivo(file, rutaAnterior);
  if (problema) throw new Error(problema);
}

async function subirObjeto(ruta, file, upsert) {
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(ruta, file, { upsert, contentType: file.type || undefined });
  if (error) throw new Error(upsert ? 'No se pudo reemplazar el archivo. Intenta de nuevo.' : 'No se pudo subir el archivo. Intenta de nuevo.');
}

async function confirmar(materialId, publish) {
  const { error } = await supabase.rpc('confirm_material_file', { target_material: materialId, publish });
  if (error) throw new Error(mensajeDeError(error));
}

/**
 * Sube un documento o imagen. Se publica solo después de que la base confirma
 * el objeto y guarda sus metadatos; si algo falla queda como borrador.
 */
export async function addFile(sessionId, { title, file }, userId) {
  const titulo = exigir(title, 'Agrega un título.');
  validarArchivo(file);
  const id = crypto.randomUUID();
  const ruta = `${id}/${nombreSeguro(file.name)}`;
  await ejecutar(
    supabase.from('materials').insert({
      id,
      session_id: sessionId,
      title: titulo,
      kind: file.type?.startsWith('image/') ? 'image' : 'document',
      storage_path: ruta,
      status: 'draft',
      created_by: userId,
    }),
  );
  await subirObjeto(ruta, file, false);
  await confirmar(id, true);
}

/**
 * El archivo nuevo ocupa el mismo nombre y ubicación; el anterior desaparece.
 * Por eso debe ser del mismo formato: un Word guardado como `guia.pdf` no abre.
 */
export async function replaceFile(material, file) {
  if (!material?.storagePath) throw new Error('Este material no tiene archivo.');
  validarArchivo(file, material.storagePath);
  await subirObjeto(material.storagePath, file, true);
  await confirmar(material.id, false);
}

/**
 * Termina una carga que falló en `addFile`: el borrador ya existe con su ruta,
 * así que se sube ahí y se confirma publicando.
 */
export async function retryFile(material, file) {
  if (!material?.storagePath) throw new Error('Este material no tiene archivo.');
  validarArchivo(file, material.storagePath);
  await subirObjeto(material.storagePath, file, true);
  await confirmar(material.id, true);
}

/** Material con archivo cuya carga no se confirmó: sigue en borrador sin versión. */
export function cargaIncompleta(material) {
  return Boolean(material?.storagePath) && material.status === 'draft' && !material.fileVersion;
}

/** Tamaño legible para la lista de material. */
export function tamanoLegible(bytes) {
  if (!Number.isFinite(bytes)) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Registra la apertura (para avisar si después cambia) y entrega una URL firmada corta. */
export async function openFile(materialId) {
  const { data: ruta, error } = await supabase.rpc('open_material_file', { target_material: materialId });
  if (error) throw new Error(mensajeDeError(error));
  const { data, error: firma } = await supabase.storage.from(BUCKET).createSignedUrl(ruta, SIGNED_URL_SECONDS);
  if (firma) throw new Error('No pudimos abrir el archivo. Intenta de nuevo.');
  return data.signedUrl;
}

/** Archivos que la persona abrió y después se reemplazaron o se retiraron. */
export async function listFileNotices() {
  const { data, error } = await supabase.rpc('my_material_notices');
  if (error) throw new Error(LOAD_ERROR);
  return data.map(n => ({ materialId: n.material_id, title: n.title, change: n.change, changedAt: n.changed_at }));
}

export async function dismissFileNotice(materialId) {
  return ejecutar(supabase.rpc('dismiss_material_notice', { target_material: materialId }));
}

/**
 * Solo el administrador retira material publicado (RLS y trigger). Si tiene
 * archivo, primero se archiva (nadie más obtiene URL) y luego se borra el objeto.
 */
export async function retireMaterial(materialId, storagePath) {
  await ejecutar(
    supabase.from('materials').update({ status: 'archived', updated_at: new Date().toISOString() }).eq('id', materialId),
  );
  if (!storagePath) return;
  const { error } = await supabase.storage.from(BUCKET).remove([storagePath]);
  if (error) throw new Error('El material se retiró, pero el archivo no se pudo borrar. Intenta de nuevo.');
}
