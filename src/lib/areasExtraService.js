// Áreas extra por alumno (#61): módulos completos además de los de su grupo.
// RLS reserva los cambios al administrador.
import { supabase } from './supabaseClient';

const LOAD_ERROR = 'No pudimos cargar las áreas. Intenta de nuevo.';
const SAVE_ERROR = 'No se pudieron guardar las áreas. Intenta de nuevo.';

export async function loadStudentAreas(studentId, group) {
  const [modulos, delGrupo, extra] = await Promise.all([
    supabase
      .from('modules')
      .select('id, title')
      .eq('course_id', group.courseId)
      .eq('status', 'active')
      .order('position'),
    supabase.from('group_modules').select('module_id').eq('group_id', group.id),
    supabase.from('student_extra_modules').select('module_id').eq('student_id', studentId),
  ]);
  if (modulos.error || delGrupo.error || extra.error) throw new Error(LOAD_ERROR);
  return {
    modules: modulos.data,
    fromGroup: delGrupo.data.map(fila => fila.module_id),
    extra: extra.data.map(fila => fila.module_id),
  };
}

export async function setStudentAreas(studentId, actuales, nuevos) {
  const retirar = actuales.filter(id => !nuevos.includes(id));
  const agregar = nuevos.filter(id => !actuales.includes(id));
  if (retirar.length > 0) {
    const { error } = await supabase
      .from('student_extra_modules')
      .delete()
      .eq('student_id', studentId)
      .in('module_id', retirar);
    if (error) throw new Error(SAVE_ERROR);
  }
  if (agregar.length > 0) {
    const { error } = await supabase
      .from('student_extra_modules')
      .insert(agregar.map(module_id => ({ student_id: studentId, module_id })));
    if (error) throw new Error(SAVE_ERROR);
  }
}
