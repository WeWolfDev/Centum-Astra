// Evaluaciones del alumno (#36). El servidor decide el tiempo, la calificación
// y cuándo se ven las respuestas: aquí solo se llaman start_attempt,
// save_answer, submit_attempt y attempt_review, y se leen las filas que la RLS
// deja ver al alumno.
import { supabase } from './supabaseClient';

const LOAD_ERROR = 'No pudimos cargar tus evaluaciones. Intenta de nuevo.';
const SAVE_ERROR = 'No se pudo guardar. Revisa tu conexión e intenta de nuevo.';

const ERRORES = {
  42501: 'Esta evaluación ya no está disponible para ti.',
  CA022: 'Esa respuesta no es válida para esta pregunta.',
  CA023: 'Este intento ya terminó.',
};

function mensajeDeError(error) {
  return ERRORES[error?.code] ?? SAVE_ERROR;
}

async function llamar(nombre, args) {
  const { data, error } = await supabase.rpc(nombre, args);
  if (error) throw new Error(mensajeDeError(error));
  return data;
}

export const TIPOS_EVALUACION = {
  simulador: 'Simulador',
  cuestionario: 'Cuestionario',
  quiz: 'Quiz',
};

/** Solo el simulador y el cuestionario dan puntaje estimado de 700 a 1300. */
export const tienePuntaje = kind => kind === 'simulador' || kind === 'cuestionario';

/** Segundos como reloj: 5:07 o, con horas, 1:05:07. */
export function formatoReloj(segundos) {
  const s = Math.max(0, segundos);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const resto = String(s % 60).padStart(2, '0');
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${resto}` : `${m}:${resto}`;
}

/** Un intento en curso cuyo tiempo ya se acabó, según el reloj del navegador. */
export function vencido(intento, ahora = Date.now()) {
  return intento?.status === 'in_progress'
    && Boolean(intento.expires_at)
    && new Date(intento.expires_at).getTime() <= ahora;
}

function toIntento(a) {
  return {
    id: a.id,
    evaluationId: a.evaluation_id,
    status: a.status,
    startedAt: a.started_at,
    expiresAt: a.expires_at,
    finishedAt: a.finished_at,
    totalQuestions: a.total_questions,
    correctCount: a.correct_count,
    percent: a.percent == null ? null : Number(a.percent),
    score: a.score,
    durationSeconds: a.duration_seconds,
    isBest: a.is_best,
  };
}

/**
 * Evaluaciones publicadas que la RLS deja ver al alumno, con su intento en
 * curso y sus resultados (el servidor conserva el mejor y el último). Un
 * intento vencido se cierra aquí para que el alumno lo vea cerrado y no
 * "Continuar" en algo que ya terminó.
 */
export async function listMyEvaluations(studentId) {
  const [evaluaciones, intentos] = await Promise.all([
    supabase
      .from('evaluations')
      .select('id, kind, title, description, time_limit_minutes, module_id, questions(count)')
      .eq('status', 'published')
      .order('created_at', { ascending: false }),
    supabase
      .from('attempts')
      .select('id, evaluation_id, status, started_at, expires_at, finished_at, total_questions, correct_count, percent, score, duration_seconds, is_best')
      .eq('student_id', studentId)
      .order('started_at', { ascending: false }),
  ]);
  if (evaluaciones.error || intentos.error) throw new Error(LOAD_ERROR);

  const filas = await Promise.all(
    intentos.data.map(a => (vencido(a) ? cerrarVencido(a) : a)),
  );
  const propios = filas.filter(Boolean).map(toIntento);

  return evaluaciones.data.map(e => {
    const deEsta = propios.filter(i => i.evaluationId === e.id);
    return {
      id: e.id,
      kind: e.kind,
      title: e.title,
      description: e.description ?? '',
      timeLimitMinutes: e.time_limit_minutes,
      moduleId: e.module_id,
      questionCount: e.questions?.[0]?.count ?? 0,
      enCurso: deEsta.find(i => i.status === 'in_progress') ?? null,
      terminados: deEsta.filter(i => i.status !== 'in_progress'),
    };
  });
}

// Si no se puede cerrar (sin conexión), se deja como estaba: pg_cron lo cierra.
// Si el servidor ya no lo tiene (solo conserva el mejor y el último), se omite.
async function cerrarVencido(fila) {
  const { data, error } = await supabase.rpc('submit_attempt', { p_attempt_id: fila.id });
  if (error?.code === '42501' || (data && !data.id)) return null;
  return error || !data ? fila : data;
}

/** Inicia un intento o retoma el que sigue en curso. El vencimiento lo fija el servidor. */
export async function startAttempt(evaluationId) {
  return toIntento(await llamar('start_attempt', { p_evaluation_id: evaluationId }));
}

/** Preguntas y opciones en orden. Las respuestas correctas nunca llegan aquí. */
export async function loadQuestions(evaluationId) {
  const { data, error } = await supabase
    .from('questions')
    .select('id, position, prompt, media_kind, media_url, question_options(id, position, body)')
    .eq('evaluation_id', evaluationId)
    .order('position');
  if (error) throw new Error(LOAD_ERROR);
  return data.map(q => ({
    id: q.id,
    position: q.position,
    prompt: q.prompt,
    mediaKind: q.media_kind,
    mediaUrl: q.media_url,
    options: [...(q.question_options ?? [])]
      .sort((a, b) => a.position - b.position)
      .map(o => ({ id: o.id, body: o.body })),
  }));
}

/** Respuestas ya guardadas de un intento, para retomarlo tras recargar. */
export async function loadAnswers(attemptId) {
  const { data, error } = await supabase
    .from('attempt_answers')
    .select('question_id, selected_option_ids')
    .eq('attempt_id', attemptId);
  if (error) throw new Error(LOAD_ERROR);
  return Object.fromEntries(data.map(a => [a.question_id, a.selected_option_ids ?? []]));
}

/** Guarda una respuesta. Si el tiempo ya venció, devuelve el intento cerrado. */
export async function saveAnswer(attemptId, questionId, optionIds) {
  return toIntento(await llamar('save_answer', {
    p_attempt_id: attemptId,
    p_question_id: questionId,
    p_option_ids: optionIds,
  }));
}

/** Entrega el intento; repetirlo devuelve el mismo resultado guardado. */
export async function submitAttempt(attemptId) {
  return toIntento(await llamar('submit_attempt', { p_attempt_id: attemptId }));
}

/** Respuestas correctas y explicaciones, solo con el intento terminado. */
export async function reviewAttempt(attemptId) {
  const filas = await llamar('attempt_review', { p_attempt_id: attemptId });
  return (filas ?? []).map(r => ({
    questionId: r.question_id,
    selected: r.selected_option_ids ?? [],
    correct: r.correct_option_ids ?? [],
    isCorrect: Boolean(r.is_correct),
    explanation: r.explanation ?? '',
  }));
}
