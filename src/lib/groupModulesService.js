// Módulos habilitados por grupo (#49). RLS reserva los cambios al administrador.
import { supabase } from './supabaseClient';

const LOAD_ERROR = 'No pudimos cargar los módulos. Intenta de nuevo.';
const SAVE_ERROR = 'No se pudieron guardar los módulos. Intenta de nuevo.';

export async function loadGroupModules(group) {
  const [modulos, habilitados] = await Promise.all([
    supabase
      .from('modules')
      .select('id, title')
      .eq('course_id', group.courseId)
      .eq('status', 'active')
      .order('position'),
    supabase.from('group_modules').select('module_id').eq('group_id', group.id),
  ]);
  if (modulos.error || habilitados.error) throw new Error(LOAD_ERROR);
  return { modules: modulos.data, enabled: habilitados.data.map(fila => fila.module_id) };
}

export async function setGroupModules(group, actuales, nuevos) {
  const retirar = actuales.filter(id => !nuevos.includes(id));
  const agregar = nuevos.filter(id => !actuales.includes(id));
  if (retirar.length > 0) {
    const { error } = await supabase
      .from('group_modules')
      .delete()
      .eq('group_id', group.id)
      .in('module_id', retirar);
    if (error) throw new Error(SAVE_ERROR);
  }
  if (agregar.length > 0) {
    const { error } = await supabase
      .from('group_modules')
      .insert(agregar.map(module_id => ({ group_id: group.id, module_id, course_id: group.courseId })));
    if (error) throw new Error(SAVE_ERROR);
  }
}
