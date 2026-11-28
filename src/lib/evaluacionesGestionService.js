// Simuladores, cuestionarios y quizzes de quien los arma (#52). RLS decide:
// el administrador edita todo; el profesor del curso crea y edita sus quizzes
// y cuestionarios. Los triggers de la base validan al publicar (CA020), la
// respuesta correcta (CA021) y que no cambien preguntas con intentos (CA024).
import { supabase } from './supabaseClient';

const LOAD_ERROR = 'No pudimos cargar las evaluaciones. Intenta de nuevo.';
const ACTION_ERROR = 'No se pudo guardar. Intenta de nuevo.';

const ERRORES = {
  42501: 'No tienes permiso para hacer este cambio.',
  23503: 'Esta evaluación ya tiene intentos; archívala en lugar de borrarla.',
  23505: 'Alguien más hizo un cambio al mismo tiempo. Recarga e intenta de nuevo.',
  23514: 'Revisa los datos: hay un valor que no es válido.',
  CA020: 'Para publicar, la evaluación necesita al menos una pregunta, y cada pregunta dos opciones y su respuesta correcta.',
  CA021: 'Revisa la respuesta correcta: debe ser una opción de la pregunta y, en un simulador, solo una.',
  CA024: 'Esta evaluación ya tiene intentos; sus preguntas no se pueden cambiar. Crea otra para corregirla.',
  CA025: 'Una evaluación publicada necesita al menos una pregunta. Agrega otra antes de borrar esta.',
};

export const TIPOS = ['simulador', 'cuestionario', 'quiz'];

export const ESTADOS = {
  draft: 'Borrador',
  published: 'Publicada',
  archived: 'Archivada',
};

/** Tono de la Pastilla por estado; archivada va en gris, no en rojo. */
export const TONO_ESTADO = { draft: 'advertencia', published: 'positivo', archived: 'negativo' };

function mensajeDeError(error) {
  return ERRORES[error?.code] ?? ACTION_ERROR;
}

async function ejecutar(consulta) {
  const { data, error } = await consulta;
  if (error) throw new Error(mensajeDeError(error));
  return data;
}

// Sin error y sin filas: la RLS ocultó la fila, así que no había permiso.
async function cambiarUna(consulta) {
  const filas = await ejecutar(consulta.select('id'));
  if (!filas?.length) throw new Error(ERRORES[42501]);
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

/** El administrador arma los tres tipos; el profesor, solo quizzes y cuestionarios. */
export function puedeEditar(evaluacion, user) {
  if (user?.role === 'admin') return true;
  return user?.role === 'teacher' && evaluacion.kind !== 'simulador' && evaluacion.createdBy === user.id;
}

// ── Lectura ──────────────────────────────────────────────────────────────────

function toEvaluacion(e) {
  return {
    id: e.id,
    courseId: e.course_id,
    moduleId: e.module_id,
    kind: e.kind,
    title: e.title,
    description: e.description ?? '',
    timeLimitMinutes: e.time_limit_minutes,
    status: e.status,
    createdBy: e.created_by,
    publishedAt: e.published_at,
    questionCount: e.questions?.[0]?.count ?? 0,
    // El profesor solo cuenta los intentos de sus alumnos (RLS de attempts).
    attemptCount: e.attempts?.[0]?.count ?? 0,
  };
}

const CAMPOS = 'id, course_id, module_id, kind, title, description, time_limit_minutes, status, created_by, published_at';

/** Evaluaciones del curso, las más nuevas primero; las archivadas solo si se piden. */
export async function listCourseEvaluations(courseId, { includeArchived = false } = {}) {
  let consulta = supabase
    .from('evaluations')
    .select(`${CAMPOS}, questions(count), attempts(count)`)
    .eq('course_id', courseId);
  if (!includeArchived) consulta = consulta.neq('status', 'archived');
  const { data, error } = await consulta.order('created_at', { ascending: false });
  if (error) throw new Error(LOAD_ERROR);
  return data.map(toEvaluacion);
}

// Una clave es uno a uno con su pregunta; PostgREST puede devolverla como objeto o arreglo.
function claveDe(q) {
  const clave = Array.isArray(q.question_keys) ? q.question_keys[0] : q.question_keys;
  return clave ?? { correct_option_ids: [], explanation: null };
}

/** Evaluación con sus preguntas en orden, opciones y respuesta correcta. */
export async function loadEvaluation(evaluationId) {
  const { data, error } = await supabase
    .from('evaluations')
    .select(
      `${CAMPOS}, attempts(count), ` +
      'questions(id, position, prompt, question_options(id, position, body), question_keys(correct_option_ids, explanation))',
    )
    .eq('id', evaluationId)
    .single();
  if (error) throw new Error(LOAD_ERROR);
  const preguntas = [...(data.questions ?? [])].sort((a, b) => a.position - b.position);
  return {
    ...toEvaluacion({ ...data, questions: [{ count: preguntas.length }] }),
    questions: preguntas.map(q => {
      const clave = claveDe(q);
      return {
        id: q.id,
        position: q.position,
        prompt: q.prompt,
        explanation: clave.explanation ?? '',
        correctOptionIds: clave.correct_option_ids ?? [],
        options: [...(q.question_options ?? [])]
          .sort((a, b) => a.position - b.position)
          .map(o => ({ id: o.id, body: o.body })),
      };
    }),
  };
}

// ── Evaluación ───────────────────────────────────────────────────────────────

/** Las mismas reglas que la tabla: módulo salvo en simulador y minutos solo en simulador. */
export function datosEvaluacion({ kind, title, description, moduleId, timeLimitMinutes }) {
  if (!TIPOS.includes(kind)) throw new Error('Elige el tipo de evaluación.');
  const esSimulador = kind === 'simulador';
  const modulo = texto(moduleId);
  if (!esSimulador && !modulo) throw new Error('Elige el área de la evaluación.');
  let minutos = null;
  if (esSimulador) {
    minutos = Number(timeLimitMinutes);
    if (!Number.isInteger(minutos) || minutos <= 0) throw new Error('Escribe la duración del simulador en minutos.');
  }
  return {
    kind,
    title: exigir(title, 'Escribe el título de la evaluación.'),
    description: texto(description),
    module_id: modulo,
    time_limit_minutes: minutos,
  };
}

/** Crea un borrador y devuelve su id. */
export async function createEvaluation({ courseId, ...evaluacion }, userId) {
  const fila = { course_id: courseId, created_by: userId, status: 'draft', ...datosEvaluacion(evaluacion) };
  const data = await ejecutar(supabase.from('evaluations').insert(fila).select('id').single());
  return data.id;
}

export async function updateEvaluation(id, evaluacion) {
  return cambiarUna(supabase.from('evaluations').update(datosEvaluacion(evaluacion)).eq('id', id));
}

/** La base revisa que tenga preguntas completas (CA020). */
export async function publishEvaluation(id) {
  return cambiarUna(supabase.from('evaluations').update({ status: 'published' }).eq('id', id));
}

/** Solo el administrador retira una evaluación publicada; conserva los resultados. */
export async function archiveEvaluation(id) {
  return cambiarUna(supabase.from('evaluations').update({ status: 'archived' }).eq('id', id));
}

/** Solo borradores sin intentos; con intentos la base lo impide (23503). */
export async function deleteEvaluation(id) {
  return cambiarUna(supabase.from('evaluations').delete().eq('id', id));
}

// ── Preguntas ────────────────────────────────────────────────────────────────

/**
 * Valida una pregunta como la base: enunciado, dos opciones o más y al menos
 * una correcta (exactamente una en simulador). Las opciones vacías se ignoran.
 * `correctas` son los índices de `options` marcados como correctos.
 */
export function datosPregunta({ prompt, options = [], correctas = [], explanation }, kind) {
  const enunciado = exigir(prompt, 'Escribe el enunciado de la pregunta.');
  const opciones = options
    .map((body, indice) => ({ body: texto(body), correcta: correctas.includes(indice) }))
    .filter(o => o.body);
  if (opciones.length < 2) throw new Error('Escribe al menos dos opciones.');
  const totalCorrectas = opciones.filter(o => o.correcta).length;
  if (totalCorrectas === 0) throw new Error('Marca la respuesta correcta.');
  if (kind === 'simulador' && totalCorrectas !== 1) throw new Error('En un simulador marca solo una respuesta correcta.');
  return { prompt: enunciado, explanation: texto(explanation), opciones };
}

// Enunciado, opciones y clave en una sola transacción (#104): si algo falla,
// la pregunta queda como estaba.
async function guardarPregunta(evaluacion, questionId, pregunta) {
  const { prompt, explanation, opciones } = datosPregunta(pregunta, evaluacion.kind);
  return ejecutar(
    supabase.rpc('save_question', {
      p_evaluation_id: evaluacion.id,
      p_question_id: questionId,
      p_prompt: prompt,
      p_options: opciones.map(o => o.body),
      p_correct: opciones.flatMap((o, indice) => (o.correcta ? [indice] : [])),
      p_explanation: explanation,
    }),
  );
}

/** Agrega la pregunta al final; la posición la calcula la base. */
export async function addQuestion(evaluacion, pregunta) {
  await guardarPregunta(evaluacion, null, pregunta);
}

/** Reemplaza enunciado, opciones y clave. Con intentos, la base lo rechaza (CA024). */
export async function updateQuestion(evaluacion, questionId, pregunta) {
  await guardarPregunta(evaluacion, questionId, pregunta);
}

export async function deleteQuestion(questionId) {
  return cambiarUna(supabase.from('questions').delete().eq('id', questionId));
}
