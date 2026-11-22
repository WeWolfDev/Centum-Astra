// Estadísticas de los paneles (#31). El servidor decide qué intentos ve cada rol
// y calcula los promedios; aquí solo se llaman sus funciones. Significado de
// cada indicador: docs/ESTADISTICAS.md.
import { supabase } from './supabaseClient';
import { SCORE_LABEL } from './evaluationsService';

const LOAD_ERROR = 'No pudimos cargar las estadísticas. Intenta de nuevo.';

// PostgREST puede mandar numeric como texto; null sigue siendo "sin datos".
const numero = valor => (valor === null || valor === undefined ? null : Number(valor));

// Periodo [desde, hasta): fechas o textos ISO. Sin periodo, todo el curso.
// Una fecha sin hora ('2026-12-01') es la medianoche de México: JavaScript la
// leería como medianoche UTC y correría 6 horas el corte. México no tiene
// horario de verano desde 2022.
function periodo({ from, to } = {}) {
  const iso = fecha => {
    if (!fecha) return null;
    const soloFecha = typeof fecha === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(fecha);
    return new Date(soloFecha ? `${fecha}T00:00:00-06:00` : fecha).toISOString();
  };
  return { p_from: iso(from), p_to: iso(to) };
}

async function llamar(funcion, parametros) {
  const { data, error } = await supabase.rpc(funcion, parametros);
  if (error) throw new Error(LOAD_ERROR);
  return data ?? [];
}

// Los dos promedios nunca se mezclan: quizzes en %, simuladores y cuestionarios en puntos.
function promedios(fila) {
  return {
    quizAvgPercent: numero(fila?.quiz_avg_percent),
    quizCount: fila?.quiz_count ?? 0,
    examAvgScore: numero(fila?.exam_avg_score),
    examCount: fila?.exam_count ?? 0,
    examScoreLabel: SCORE_LABEL,
  };
}

/** Promedios del alumno; sin `studentId`, los de quien llama. */
export async function getStudentStats(studentId = null, rango) {
  const [fila] = await llamar('student_stats', { p_student: studentId, ...periodo(rango) });
  return promedios(fila);
}

/** Calificaciones: el mejor intento de cada evaluación. */
export async function listStudentResults(studentId = null, rango) {
  const filas = await llamar('student_results', { p_student: studentId, ...periodo(rango) });
  return filas.map(f => ({
    evaluationId: f.evaluation_id,
    title: f.title,
    kind: f.kind,
    moduleId: f.module_id,
    percent: numero(f.percent),
    score: f.score,
    scoreLabel: f.score === null ? null : SCORE_LABEL,
    correctCount: f.correct_count,
    totalQuestions: f.total_questions,
    finishedAt: f.finished_at,
  }));
}

/** Promedio de quizzes por módulo, para mostrar las áreas a mejorar. */
export async function listStudentModuleQuizStats(studentId = null, rango) {
  const filas = await llamar('student_module_quiz_stats', { p_student: studentId, ...periodo(rango) });
  return filas.map(f => ({ moduleId: f.module_id, quizAvgPercent: numero(f.quiz_avg_percent), quizCount: f.quiz_count }));
}

/** Grupos que ve quien llama: el maestro los suyos, el administrador todos. */
export async function listGroupStats(rango) {
  const filas = await llamar('group_stats', periodo(rango));
  return filas.map(f => ({
    groupId: f.group_id,
    groupName: f.group_name,
    courseId: f.course_id,
    generation: f.generation,
    studentCount: f.student_count,
    ...promedios(f),
  }));
}

export async function listGroupStudentStats(groupId, rango) {
  const filas = await llamar('group_student_stats', { p_group: groupId, ...periodo(rango) });
  return filas.map(f => ({
    studentId: f.student_id,
    fullName: f.full_name,
    lastFinishedAt: f.last_finished_at,
    ...promedios(f),
  }));
}

/** Promedios por semana (lunes a domingo, hora de Ciudad de México). */
export async function listWeeklyStats(groupId = null, rango) {
  const filas = await llamar('weekly_stats', { p_group: groupId, ...periodo(rango) });
  return filas.map(f => ({ weekStart: f.week_start, ...promedios(f) }));
}

/** Resumen de todos los alumnos; solo el administrador recibe datos. */
export async function getStatsOverview(rango) {
  const [fila] = await llamar('stats_overview', periodo(rango));
  return fila ? { studentsWithResults: fila.students_with_results, ...promedios(fila) } : null;
}
