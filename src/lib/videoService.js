// Videoteca con videos de Google Drive (#29). Los videos son material con
// kind = 'video_link' (#34): la RLS deja ver solo lo publicado de los módulos
// del alumno. El catálogo no trae la URL; se entrega al abrir, después de
// registrar la apertura (decisión 1.5 del cliente).
import { supabase } from './supabaseClient';

const LOAD_ERROR = 'No pudimos cargar los videos. Intenta de nuevo.';
const ACTION_ERROR = 'No se pudo guardar. Intenta de nuevo.';
const PERMISSION_DENIED = '42501';
const UNIQUE_VIOLATION = '23505';
const UNAVAILABLE = 'CA004';

export const MOTIVOS_REPORTE = [
  { valor: 'no_carga', etiqueta: 'El video no carga' },
  { valor: 'sin_permiso', etiqueta: 'Drive me pide permiso' },
  { valor: 'otro', etiqueta: 'Otro problema' },
];

/** Videos publicados que la persona puede ver, del más reciente al más antiguo. */
export async function listVideoCatalog() {
  const { data, error } = await supabase
    .from('materials')
    .select('id, title, created_by, created_at, sessions!inner(id, title, status, modules!inner(id, title, status))')
    .eq('kind', 'video_link')
    .eq('status', 'published')
    .order('created_at', { ascending: false });
  if (error) throw new Error(LOAD_ERROR);
  return data
    .filter(v => v.sessions.status === 'active' && v.sessions.modules.status === 'active')
    .map(v => ({
      id: v.id,
      title: v.title,
      moduleId: v.sessions.modules.id,
      moduleTitle: v.sessions.modules.title,
      sessionId: v.sessions.id,
      sessionTitle: v.sessions.title,
      createdBy: v.created_by,
      createdAt: v.created_at,
    }));
}

/** Registra la apertura y devuelve el enlace de Drive solo si la persona puede verlo. */
export async function openVideo(materialId) {
  const { data, error } = await supabase.rpc('open_material_link', { target_material: materialId });
  if (error?.code === UNAVAILABLE) throw new Error('Este video ya no está disponible.');
  if (error) throw new Error('No pudimos abrir el video. Intenta de nuevo.');
  return data;
}

export async function reportVideo(materialId, { reason, note }, userId) {
  if (!MOTIVOS_REPORTE.some(m => m.valor === reason)) throw new Error('Elige qué problema tiene el video.');
  const nota = (note ?? '').trim();
  if (nota.length > 500) throw new Error('El comentario puede tener hasta 500 caracteres.');
  const { error } = await supabase
    .from('material_reports')
    .insert({ material_id: materialId, reporter_id: userId, reason, note: nota || null });
  if (error?.code === UNIQUE_VIOLATION) throw new Error('Ya reportaste este video; el administrador lo revisará.');
  if (error?.code === PERMISSION_DENIED) throw new Error('No tienes permiso para reportar este material.');
  if (error) throw new Error(ACTION_ERROR);
}

/** Reportes sin resolver. La RLS solo se los da todos al administrador. */
export async function listOpenReports() {
  const { data, error } = await supabase
    .from('material_reports')
    .select('material_id, reason, created_at')
    .is('resolved_at', null);
  if (error) throw new Error(LOAD_ERROR);
  return data.map(r => ({ materialId: r.material_id, reason: r.reason, createdAt: r.created_at }));
}

export async function resolveReports(materialId, adminId) {
  const { error } = await supabase
    .from('material_reports')
    .update({ resolved_at: new Date().toISOString(), resolved_by: adminId })
    .eq('material_id', materialId)
    .is('resolved_at', null);
  if (error?.code === PERMISSION_DENIED) throw new Error('No tienes permiso para hacer este cambio.');
  if (error) throw new Error(ACTION_ERROR);
}
