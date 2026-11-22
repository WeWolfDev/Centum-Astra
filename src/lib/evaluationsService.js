// Evaluaciones e intentos (#30). El servidor fija el vencimiento, califica y
// decide cuándo se muestran las respuestas correctas; aquí solo se llaman sus
// funciones y se traducen los resultados para las pantallas.
import { supabase } from './supabaseClient';

const LOAD_ERROR = 'No pudimos cargar la evaluación. Intenta de nuevo.';
const ACTION_ERROR = 'No se pudo completar la acción. Intenta de nuevo.';

const MENSAJES = {
  42501: 'No tienes acceso a esta evaluación.',
  CA022: 'La respuesta no es válida para esta pregunta.',
  CA023: 'Esta evaluación ya terminó.',
};

// El puntaje de 700 a 1300 es una estimación de práctica, no un resultado oficial.
export const SCORE_LABEL = 'Puntaje estimado';

function errorDeAccion(error) {
  return new Error(MENSAJES[error?.code] ?? ACTION_ERROR);
}

export function toAttempt(row) {
  if (!row) return null;
  return {
    id: row.id,
    evaluationId: row.evaluation_id,
    status: row.status,
    finished: row.status !== 'in_progress',
    startedAt: row.started_at,
    expiresAt: row.expires_at,
    finishedAt: row.finished_at,
    totalQuestions: row.total_questions,
    correctCount: row.correct_count,
    percent: row.percent === null || row.percent === undefined ? null : Number(row.percent),
    score: row.score,
    scoreLabel: row.score === null || row.score === undefined ? null : SCORE_LABEL,
    durationSeconds: row.duration_seconds,
    isBest: row.is_best,
  };
}

function porPosicion(a, b) {
  return a.position - b.position;
}

export function toEvaluation(row) {
  return {
    id: row.id,
    courseId: row.course_id,
    moduleId: row.module_id,
    kind: row.kind,
    title: row.title,
    description: row.description,
    timeLimitMinutes: row.time_limit_minutes,
    status: row.status,
    questions: [...(row.questions ?? [])].sort(porPosicion).map(q => ({
      id: q.id,
      position: q.position,
      prompt: q.prompt,
      mediaKind: q.media_kind,
      mediaPath: q.media_path,
      mediaUrl: q.media_url,
      options: [...(q.question_options ?? [])].sort(porPosicion).map(o => ({
        id: o.id,
        position: o.position,
        body: o.body,
      })),
    })),
  };
}

const EVALUATION_COLUMNS = 'id, course_id, module_id, kind, title, description, time_limit_minutes, status';

export async function listEvaluations() {
  const { data, error } = await supabase
    .from('evaluations')
    .select(EVALUATION_COLUMNS)
    .order('created_at', { ascending: false });
  if (error) throw new Error(LOAD_ERROR);
  return data.map(toEvaluation);
}

// Preguntas y opciones, sin respuestas correctas: el alumno no puede leerlas.
export async function loadEvaluation(evaluationId) {
  const { data, error } = await supabase
    .from('evaluations')
    .select(
      `${EVALUATION_COLUMNS}, questions(id, position, prompt, media_kind, media_path, media_url, question_options(id, position, body))`,
    )
    .eq('id', evaluationId)
    .single();
  if (error) throw new Error(LOAD_ERROR);
  return toEvaluation(data);
}

// Mejor y último intento del alumno en una evaluación.
export async function listMyAttempts(evaluationId) {
  const { data, error } = await supabase
    .from('attempts')
    .select('*')
    .eq('evaluation_id', evaluationId)
    .order('started_at', { ascending: false });
  if (error) throw new Error(LOAD_ERROR);
  return data.map(toAttempt);
}

async function llamar(funcion, parametros) {
  const { data, error } = await supabase.rpc(funcion, parametros);
  if (error) throw errorDeAccion(error);
  return data;
}

// Inicia un intento o retoma el que sigue en curso.
export async function startAttempt(evaluationId) {
  return toAttempt(await llamar('start_attempt', { p_evaluation_id: evaluationId }));
}

// Si el tiempo ya venció, el servidor cierra el intento y lo devuelve terminado.
export async function saveAnswer(attemptId, questionId, optionIds) {
  return toAttempt(
    await llamar('save_answer', {
      p_attempt_id: attemptId,
      p_question_id: questionId,
      p_option_ids: optionIds,
    }),
  );
}

// Entregar dos veces devuelve el mismo resultado.
export async function submitAttempt(attemptId) {
  return toAttempt(await llamar('submit_attempt', { p_attempt_id: attemptId }));
}

// Respuestas correctas y explicaciones; solo disponibles al terminar.
export async function loadReview(attemptId) {
  const filas = await llamar('attempt_review', { p_attempt_id: attemptId });
  return filas.map(f => ({
    questionId: f.question_id,
    position: f.question_position,
    prompt: f.prompt,
    selectedOptionIds: f.selected_option_ids,
    correctOptionIds: f.correct_option_ids,
    isCorrect: f.is_correct,
    explanation: f.explanation,
  }));
}
