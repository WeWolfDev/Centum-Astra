import { beforeEach, describe, expect, test, vi } from 'vitest';

const fake = vi.hoisted(() => {
  const calls = { insert: [], remove: [] };
  const respuestas = { modules: { data: [], error: null }, group_modules: { data: [], error: null }, escritura: { error: null } };
  const lectura = tabla => {
    const chain = {
      eq: () => chain,
      order: () => chain,
      then: (ok, ko) => Promise.resolve(respuestas[tabla]).then(ok, ko),
    };
    return chain;
  };
  const from = vi.fn(tabla => ({
    select: () => lectura(tabla),
    insert: filas => { calls.insert.push(filas); return Promise.resolve(respuestas.escritura); },
    delete: () => {
      const filtros = [];
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

const { loadGroupModules, setGroupModules } = await import('./groupModulesService');

const GRUPO = { id: 'g1', courseId: 'c1' };

beforeEach(() => {
  fake.calls.insert.length = 0;
  fake.calls.remove.length = 0;
  fake.respuestas.modules = { data: [], error: null };
  fake.respuestas.group_modules = { data: [], error: null };
  fake.respuestas.escritura = { error: null };
});

describe('loadGroupModules', () => {
  test('devuelve los módulos y los habilitados', async () => {
    fake.respuestas.modules.data = [{ id: 'm1', title: 'Álgebra' }];
    fake.respuestas.group_modules.data = [{ module_id: 'm1' }];
    await expect(loadGroupModules(GRUPO)).resolves.toEqual({
      modules: [{ id: 'm1', title: 'Álgebra' }],
      enabled: ['m1'],
    });
  });

  test('informa un error de carga', async () => {
    fake.respuestas.group_modules = { data: null, error: { message: 'x' } };
    await expect(loadGroupModules(GRUPO)).rejects.toThrow(/cargar los módulos/);
  });
});

describe('setGroupModules', () => {
  test('agrega y retira solo las diferencias', async () => {
    await setGroupModules(GRUPO, ['m1', 'm2'], ['m2', 'm3']);
    expect(fake.calls.remove[0]).toEqual([['group_id', 'g1'], ['module_id', ['m1']]]);
    expect(fake.calls.insert[0]).toEqual([{ group_id: 'g1', module_id: 'm3', course_id: 'c1' }]);
  });

  test('no escribe si no hay cambios', async () => {
    await setGroupModules(GRUPO, ['m1'], ['m1']);
    expect(fake.calls.remove).toHaveLength(0);
    expect(fake.calls.insert).toHaveLength(0);
  });

  test('informa un error al guardar', async () => {
    fake.respuestas.escritura = { error: { message: 'x' } };
    await expect(setGroupModules(GRUPO, [], ['m1'])).rejects.toThrow(/guardar los módulos/);
  });
});
