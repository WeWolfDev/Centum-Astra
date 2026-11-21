import { beforeEach, describe, expect, test, vi } from 'vitest';

const fake = vi.hoisted(() => {
  const calls = { insert: [], remove: [], filtros: {} };
  const respuestas = {
    modules: { data: [], error: null },
    group_modules: { data: [], error: null },
    student_extra_modules: { data: [], error: null },
    escritura: { error: null },
  };
  const lectura = tabla => {
    calls.filtros[tabla] = [];
    const chain = {
      eq: (c, v) => { calls.filtros[tabla].push([c, v]); return chain; },
      order: () => chain,
      then: (ok, ko) => Promise.resolve(respuestas[tabla]).then(ok, ko),
    };
    return chain;
  };
  const from = vi.fn(tabla => ({
    select: () => lectura(tabla),
    insert: filas => { calls.insert.push([tabla, filas]); return Promise.resolve(respuestas.escritura); },
    delete: () => {
      const filtros = [tabla];
      calls.remove.push(filtros);
      const chain = {
        eq: (c, v) => { filtros.push([c, v]); return chain; },
        in: (c, v) => { filtros.push([c, v]); return chain; },
        then: (ok, ko) => Promise.resolve(respuestas.escritura).then(ok, ko),
      };
      return chain;
    },
  }));
  return { calls, respuestas, supabase: { from } };
});

vi.mock('./supabaseClient', () => ({ supabase: fake.supabase }));

const { loadStudentAreas, setStudentAreas } = await import('./areasExtraService');

const GRUPO = { id: 'g1', courseId: 'c1' };

beforeEach(() => {
  fake.calls.insert.length = 0;
  fake.calls.remove.length = 0;
  fake.respuestas.modules = { data: [], error: null };
  fake.respuestas.group_modules = { data: [], error: null };
  fake.respuestas.student_extra_modules = { data: [], error: null };
  fake.respuestas.escritura = { error: null };
});

describe('loadStudentAreas', () => {
  test('devuelve los módulos del curso, los del grupo y las áreas extra del alumno', async () => {
    fake.respuestas.modules.data = [{ id: 'm1', title: 'Matemático' }, { id: 'm2', title: 'Premedicina' }];
    fake.respuestas.group_modules.data = [{ module_id: 'm1' }];
    fake.respuestas.student_extra_modules.data = [{ module_id: 'm2' }];
    await expect(loadStudentAreas('a1', GRUPO)).resolves.toEqual({
      modules: [{ id: 'm1', title: 'Matemático' }, { id: 'm2', title: 'Premedicina' }],
      fromGroup: ['m1'],
      extra: ['m2'],
    });
    expect(fake.calls.filtros.modules).toEqual([['course_id', 'c1'], ['status', 'active']]);
    expect(fake.calls.filtros.group_modules).toEqual([['group_id', 'g1']]);
    expect(fake.calls.filtros.student_extra_modules).toEqual([['student_id', 'a1']]);
  });

  test('informa un error de carga', async () => {
    fake.respuestas.student_extra_modules = { data: null, error: { message: 'x' } };
    await expect(loadStudentAreas('a1', GRUPO)).rejects.toThrow(/cargar las áreas/);
  });
});

describe('setStudentAreas', () => {
  test('agrega y retira solo las diferencias', async () => {
    await setStudentAreas('a1', ['m1', 'm2'], ['m2', 'm3']);
    expect(fake.calls.remove[0]).toEqual(['student_extra_modules', ['student_id', 'a1'], ['module_id', ['m1']]]);
    expect(fake.calls.insert[0]).toEqual(['student_extra_modules', [{ student_id: 'a1', module_id: 'm3' }]]);
  });

  test('no escribe si no hay cambios', async () => {
    await setStudentAreas('a1', ['m1'], ['m1']);
    expect(fake.calls.remove).toHaveLength(0);
    expect(fake.calls.insert).toHaveLength(0);
  });

  test('informa un error al retirar', async () => {
    fake.respuestas.escritura = { error: { message: 'x' } };
    await expect(setStudentAreas('a1', ['m1'], [])).rejects.toThrow(/guardar las áreas/);
  });

  test('informa un error al agregar', async () => {
    fake.respuestas.escritura = { error: { message: 'x' } };
    await expect(setStudentAreas('a1', [], ['m1'])).rejects.toThrow(/guardar las áreas/);
  });
});
