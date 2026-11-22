import { beforeEach, describe, expect, test, vi } from 'vitest';

// Cada consulta registra sus pasos y responde según "tabla.operación".
const fake = vi.hoisted(() => {
  const calls = [];
  const respuestas = {};
  const from = vi.fn(tabla => {
    const registro = { tabla, pasos: [] };
    calls.push(registro);
    let operacion = 'select';
    const chain = {};
    for (const metodo of ['select', 'insert', 'update', 'upsert', 'delete', 'eq', 'neq', 'order', 'single']) {
      chain[metodo] = (...args) => {
        registro.pasos.push([metodo, ...args]);
        if (['insert', 'update', 'upsert', 'delete'].includes(metodo)) operacion = metodo;
        return chain;
      };
    }
    chain.then = (ok, ko) => {
      const clave = `${tabla}.${operacion}`;
      const lista = respuestas[clave];
      const respuesta = Array.isArray(lista) ? (lista.length > 1 ? lista.shift() : lista[0]) : lista;
      return Promise.resolve(respuesta ?? { data: [{ id: 'x' }], error: null }).then(ok, ko);
    };
    return chain;
  });
  return { calls, respuestas, supabase: { from } };
});

vi.mock('./supabaseClient', () => ({ supabase: fake.supabase }));

const {
  addQuestion, archiveEvaluation, createEvaluation, datosEvaluacion, datosPregunta, deleteEvaluation, deleteQuestion,
  listCourseEvaluations, loadEvaluation, publishEvaluation, puedeEditar, updateEvaluation, updateQuestion,
} = await import('./evaluacionesGestionService');

beforeEach(() => {
  fake.calls.length = 0;
  for (const clave of Object.keys(fake.respuestas)) delete fake.respuestas[clave];
});

const pasos = tabla => fake.calls.filter(c => c.tabla === tabla).map(c => c.pasos);
const error = code => ({ data: null, error: { code, message: 'x' } });

describe('puedeEditar', () => {
  test('el administrador edita todo y el profesor solo sus quizzes y cuestionarios', () => {
    const admin = { id: 'a', role: 'admin' };
    const profe = { id: 'p', role: 'teacher' };
    expect(puedeEditar({ kind: 'simulador', createdBy: 'a' }, admin)).toBe(true);
    expect(puedeEditar({ kind: 'quiz', createdBy: 'p' }, profe)).toBe(true);
    expect(puedeEditar({ kind: 'quiz', createdBy: 'otro' }, profe)).toBe(false);
    expect(puedeEditar({ kind: 'simulador', createdBy: 'p' }, profe)).toBe(false);
    expect(puedeEditar({ kind: 'quiz', createdBy: 's' }, { id: 's', role: 'student' })).toBe(false);
  });
});

describe('listCourseEvaluations', () => {
  test('devuelve las del curso sin archivadas, con conteos', async () => {
    fake.respuestas['evaluations.select'] = {
      data: [{
        id: 'e1', course_id: 'c1', module_id: null, kind: 'simulador', title: 'Sim', description: null,
        time_limit_minutes: 90, status: 'draft', created_by: 'a', published_at: null,
        questions: [{ count: 3 }], attempts: [{ count: 0 }],
      }],
      error: null,
    };
    const [e] = await listCourseEvaluations('c1');
    expect(e).toMatchObject({ id: 'e1', kind: 'simulador', description: '', questionCount: 3, attemptCount: 0, timeLimitMinutes: 90 });
    expect(pasos('evaluations')[0]).toContainEqual(['eq', 'course_id', 'c1']);
    expect(pasos('evaluations')[0]).toContainEqual(['neq', 'status', 'archived']);
  });

  test('incluye las archivadas si se piden y avisa errores de carga', async () => {
    fake.respuestas['evaluations.select'] = { data: [], error: null };
    await listCourseEvaluations('c1', { includeArchived: true });
    expect(pasos('evaluations')[0].some(p => p[0] === 'neq')).toBe(false);

    fake.respuestas['evaluations.select'] = error('500');
    await expect(listCourseEvaluations('c1')).rejects.toThrow(/cargar las evaluaciones/);
  });
});

describe('loadEvaluation', () => {
  test('ordena preguntas y opciones y lee la clave como objeto o arreglo', async () => {
    fake.respuestas['evaluations.select'] = {
      data: {
        id: 'e1', course_id: 'c1', module_id: 'm1', kind: 'quiz', title: 'Q', description: 'd',
        time_limit_minutes: null, status: 'published', created_by: 'p', published_at: '2026', attempts: [{ count: 2 }],
        questions: [
          { id: 'q2', position: 4, prompt: 'Dos', question_options: [], question_keys: null },
          {
            id: 'q1', position: 0, prompt: 'Uno',
            question_options: [{ id: 'o2', position: 1, body: 'B' }, { id: 'o1', position: 0, body: 'A' }],
            question_keys: [{ correct_option_ids: ['o1'], explanation: 'Porque sí' }],
          },
        ],
      },
      error: null,
    };
    const e = await loadEvaluation('e1');
    expect(e.questionCount).toBe(2);
    expect(e.attemptCount).toBe(2);
    expect(e.nextPosition).toBe(5);
    expect(e.questions.map(q => q.id)).toEqual(['q1', 'q2']);
    expect(e.questions[0]).toEqual({
      id: 'q1', position: 0, prompt: 'Uno', explanation: 'Porque sí', correctOptionIds: ['o1'],
      options: [{ id: 'o1', body: 'A' }, { id: 'o2', body: 'B' }],
    });
    expect(e.questions[1]).toMatchObject({ correctOptionIds: [], explanation: '' });
  });

  test('avisa si no se puede cargar', async () => {
    fake.respuestas['evaluations.select'] = error('PGRST116');
    await expect(loadEvaluation('e1')).rejects.toThrow(/cargar/);
  });
});

describe('datosEvaluacion', () => {
  test('valida como la base', () => {
    expect(() => datosEvaluacion({ kind: 'examen', title: 'X' })).toThrow(/tipo/);
    expect(() => datosEvaluacion({ kind: 'quiz', title: 'X' })).toThrow(/área/);
    expect(() => datosEvaluacion({ kind: 'quiz', title: '  ', moduleId: 'm1' })).toThrow(/título/);
    expect(() => datosEvaluacion({ kind: 'simulador', title: 'S', timeLimitMinutes: '' })).toThrow(/minutos/);
    expect(() => datosEvaluacion({ kind: 'simulador', title: 'S', timeLimitMinutes: '1.5' })).toThrow(/minutos/);
    expect(datosEvaluacion({ kind: 'simulador', title: ' S ', timeLimitMinutes: '90', moduleId: '' })).toEqual({
      kind: 'simulador', title: 'S', description: null, module_id: null, time_limit_minutes: 90,
    });
    // Los minutos solo existen en el simulador.
    expect(datosEvaluacion({ kind: 'quiz', title: 'Q', moduleId: 'm1', timeLimitMinutes: 30, description: ' d ' })).toEqual({
      kind: 'quiz', title: 'Q', description: 'd', module_id: 'm1', time_limit_minutes: null,
    });
  });
});

describe('evaluación', () => {
  test('crea un borrador del autor y devuelve su id', async () => {
    fake.respuestas['evaluations.insert'] = { data: { id: 'nueva' }, error: null };
    const id = await createEvaluation({ courseId: 'c1', kind: 'quiz', title: 'Q', moduleId: 'm1' }, 'u1');
    expect(id).toBe('nueva');
    expect(pasos('evaluations')[0][0]).toEqual(['insert', {
      course_id: 'c1', created_by: 'u1', status: 'draft', kind: 'quiz', title: 'Q', description: null, module_id: 'm1', time_limit_minutes: null,
    }]);
  });

  test('traduce el permiso negado al crear', async () => {
    fake.respuestas['evaluations.insert'] = error('42501');
    await expect(createEvaluation({ courseId: 'c1', kind: 'simulador', title: 'S', timeLimitMinutes: 60 }, 'p'))
      .rejects.toThrow('No tienes permiso para hacer este cambio.');
  });

  test('edita, publica, archiva y borra una sola fila', async () => {
    await updateEvaluation('e1', { kind: 'quiz', title: 'Q2', moduleId: 'm1' });
    await publishEvaluation('e1');
    await archiveEvaluation('e1');
    await deleteEvaluation('e1');
    const [editar, publicar, archivar, borrar] = pasos('evaluations');
    expect(editar[0][0]).toBe('update');
    expect(publicar[0]).toEqual(['update', { status: 'published' }]);
    expect(archivar[0]).toEqual(['update', { status: 'archived' }]);
    expect(borrar[0]).toEqual(['delete']);
    expect(borrar).toContainEqual(['eq', 'id', 'e1']);
  });

  test('sin filas cambiadas, la RLS no dio permiso', async () => {
    fake.respuestas['evaluations.update'] = { data: [], error: null };
    await expect(archiveEvaluation('e1')).rejects.toThrow(/permiso/);
  });

  test.each([
    ['CA020', /al menos una pregunta/],
    ['CA021', /respuesta correcta/],
    ['23514', /Revisa los datos/],
    ['23505', /al mismo tiempo/],
    ['XX000', /No se pudo guardar/],
  ])('mensaje claro para %s al publicar', async (code, mensaje) => {
    fake.respuestas['evaluations.update'] = error(code);
    await expect(publishEvaluation('e1')).rejects.toThrow(mensaje);
  });

  test('con intentos no se borra', async () => {
    fake.respuestas['evaluations.delete'] = error('23503');
    await expect(deleteEvaluation('e1')).rejects.toThrow(/archívala/);
  });
});

describe('datosPregunta', () => {
  test('pide enunciado, dos opciones y la correcta', () => {
    expect(() => datosPregunta({ prompt: ' ', options: ['a', 'b'], correctas: [0] }, 'quiz')).toThrow(/enunciado/);
    expect(() => datosPregunta({ prompt: 'P', options: ['a', ' '], correctas: [0] }, 'quiz')).toThrow(/dos opciones/);
    expect(() => datosPregunta({ prompt: 'P', options: ['a', 'b'], correctas: [] }, 'quiz')).toThrow(/correcta/);
    // Una opción vacía marcada no cuenta como correcta.
    expect(() => datosPregunta({ prompt: 'P', options: ['a', 'b', ''], correctas: [2] }, 'quiz')).toThrow(/correcta/);
    expect(() => datosPregunta({ prompt: 'P', options: ['a', 'b'], correctas: [0, 1] }, 'simulador')).toThrow(/solo una/);
    expect(datosPregunta({ prompt: ' P ', options: ['a', '', 'c'], correctas: [0, 2], explanation: '' }, 'quiz')).toEqual({
      prompt: 'P',
      explanation: null,
      opciones: [{ body: 'a', correcta: true }, { body: 'c', correcta: true }],
    });
  });
});

describe('preguntas', () => {
  const evaluacion = { id: 'e1', kind: 'simulador', nextPosition: 3 };
  const pregunta = { prompt: '¿2+2?', options: ['4', '5', ''], correctas: [0], explanation: 'Suma' };

  test('agrega la pregunta al final con opciones en orden y la clave con sus ids', async () => {
    fake.respuestas['questions.insert'] = { data: { id: 'q1' }, error: null };
    fake.respuestas['question_options.insert'] = { data: [{ id: 'o2', position: 1 }, { id: 'o1', position: 0 }], error: null };
    fake.respuestas['question_keys.upsert'] = { data: null, error: null };

    await addQuestion(evaluacion, pregunta);

    expect(pasos('questions')[0][0]).toEqual(['insert', { evaluation_id: 'e1', position: 3, prompt: '¿2+2?' }]);
    expect(pasos('question_options')[0][0]).toEqual(['insert', [
      { question_id: 'q1', position: 0, body: '4' },
      { question_id: 'q1', position: 1, body: '5' },
    ]]);
    expect(pasos('question_keys')[0][0]).toEqual([
      'upsert', { question_id: 'q1', correct_option_ids: ['o1'], explanation: 'Suma' }, { onConflict: 'question_id' },
    ]);
  });

  test('si la clave falla borra la pregunta a medias y explica el error', async () => {
    fake.respuestas['questions.insert'] = { data: { id: 'q1' }, error: null };
    fake.respuestas['question_options.insert'] = { data: [{ id: 'o1', position: 0 }, { id: 'o2', position: 1 }], error: null };
    fake.respuestas['question_keys.upsert'] = error('CA021');

    await expect(addQuestion(evaluacion, pregunta)).rejects.toThrow(/respuesta correcta/);
    expect(pasos('questions')[1]).toEqual([['delete'], ['eq', 'id', 'q1']]);
  });

  test('con intentos no deja agregar ni editar', async () => {
    fake.respuestas['questions.insert'] = error('CA024');
    await expect(addQuestion(evaluacion, pregunta)).rejects.toThrow(/ya tiene intentos/);
    fake.respuestas['questions.update'] = error('CA024');
    await expect(updateQuestion(evaluacion, 'q1', pregunta)).rejects.toThrow(/ya tiene intentos/);
    expect(pasos('question_options')).toEqual([]);
  });

  test('editar reemplaza enunciado, opciones y clave', async () => {
    fake.respuestas['question_options.insert'] = { data: [{ id: 'n1', position: 0 }, { id: 'n2', position: 1 }], error: null };
    await updateQuestion({ ...evaluacion, kind: 'quiz' }, 'q1', { ...pregunta, correctas: [0, 1] });
    expect(pasos('questions')[0][0]).toEqual(['update', { prompt: '¿2+2?' }]);
    expect(pasos('question_options')[0]).toEqual([['delete'], ['eq', 'question_id', 'q1']]);
    expect(pasos('question_keys')[0][0][1].correct_option_ids).toEqual(['n1', 'n2']);
  });

  test('borra una pregunta', async () => {
    await deleteQuestion('q1');
    expect(pasos('questions')[0]).toEqual([['delete'], ['eq', 'id', 'q1'], ['select', 'id']]);
  });

  test('valida antes de llamar a la base', async () => {
    await expect(addQuestion(evaluacion, { ...pregunta, correctas: [0, 1] })).rejects.toThrow(/solo una/);
    expect(fake.calls).toEqual([]);
  });
});
