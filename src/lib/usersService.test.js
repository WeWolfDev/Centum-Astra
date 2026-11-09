import { beforeEach, describe, expect, test, vi } from 'vitest';

const fake = vi.hoisted(() => {
  const calls = { upsert: [], remove: [], insert: [] };
  const result = { error: null };
  const invoke = vi.fn();
  const builder = {
    upsert: (fila, opts) => { calls.upsert.push({ fila, opts }); return Promise.resolve(result); },
    insert: filas => { calls.insert.push(filas); return Promise.resolve(result); },
    delete: () => {
      const filtro = { filtros: [] };
      calls.remove.push(filtro);
      const chain = {
        eq: (c, v) => { filtro.filtros.push([c, v]); return chain; },
        in: (c, v) => { filtro.filtros.push([c, v]); return chain; },
        then: (ok, ko) => Promise.resolve(result).then(ok, ko),
      };
      return chain;
    },
  };
  return { calls, result, invoke, supabase: { from: vi.fn(() => builder), functions: { invoke } } };
});

vi.mock('./supabaseClient', () => ({ supabase: fake.supabase }));

const { filterUsers, runAdminAction, setUserGroups, toUserRow } = await import('./usersService');

beforeEach(() => {
  fake.calls.upsert.length = 0;
  fake.calls.remove.length = 0;
  fake.calls.insert.length = 0;
  fake.result.error = null;
  fake.invoke.mockReset();
});

describe('toUserRow', () => {
  const base = { id: '1', full_name: 'Ana', email: 'a@x.mx', role: 'student', status: 'active', created_at: 'hoy' };

  test('acepta la relación 1 a 1 como objeto', () => {
    const fila = toUserRow({ ...base, group_students: { group_id: 'g1', groups: { name: 'Grupo A' } }, group_teachers: [] });
    expect(fila.groups).toEqual([{ id: 'g1', name: 'Grupo A' }]);
  });

  test('acepta varias asignaciones como arreglo', () => {
    const fila = toUserRow({
      ...base,
      role: 'teacher',
      group_students: null,
      group_teachers: [{ group_id: 'g1', groups: { name: 'A' } }, { group_id: 'g2', groups: { name: 'B' } }],
    });
    expect(fila.groups.map(g => g.id)).toEqual(['g1', 'g2']);
  });

  test('usa el correo si no hay nombre', () => {
    expect(toUserRow({ ...base, full_name: '  ' }).name).toBe('a@x.mx');
  });
});

describe('filterUsers', () => {
  const users = [
    { name: 'Ana García', email: 'ana@x.mx', role: 'student' },
    { name: 'Luis Pérez', email: 'luis@x.mx', role: 'teacher' },
  ];

  test('busca por nombre o correo sin distinguir mayúsculas', () => {
    expect(filterUsers(users, { search: 'GARC' })).toHaveLength(1);
    expect(filterUsers(users, { search: 'luis@' })).toHaveLength(1);
  });

  test('filtra por rol', () => {
    expect(filterUsers(users, { role: 'teacher' })[0].name).toBe('Luis Pérez');
  });
});

describe('runAdminAction', () => {
  test('muestra el mensaje que devuelve la función', async () => {
    fake.invoke.mockResolvedValue({
      data: null,
      error: { context: { json: () => Promise.resolve({ error: 'Ya existe una cuenta con ese correo.' }) } },
    });
    await expect(runAdminAction('invite', {})).rejects.toThrow('Ya existe una cuenta');
  });

  test('usa un mensaje genérico si la respuesta no es legible', async () => {
    fake.invoke.mockResolvedValue({ data: null, error: { message: 'Failed to fetch' } });
    await expect(runAdminAction('invite', {})).rejects.toThrow('No se pudo completar');
  });
});

describe('setUserGroups', () => {
  test('mueve al alumno con upsert por student_id', async () => {
    await setUserGroups({ id: 's1', role: 'student', groups: [] }, ['g2']);
    expect(fake.calls.upsert[0]).toEqual({ fila: { group_id: 'g2', student_id: 's1' }, opts: { onConflict: 'student_id' } });
  });

  test('retira al alumno si no se elige grupo', async () => {
    await setUserGroups({ id: 's1', role: 'student', groups: [{ id: 'g1' }] }, []);
    expect(fake.calls.remove[0].filtros).toEqual([['student_id', 's1']]);
  });

  test('aplica solo la diferencia para el profesor', async () => {
    await setUserGroups({ id: 't1', role: 'teacher', groups: [{ id: 'g1' }, { id: 'g2' }] }, ['g2', 'g3']);
    expect(fake.calls.remove[0].filtros).toEqual([['teacher_id', 't1'], ['group_id', ['g1']]]);
    expect(fake.calls.insert[0]).toEqual([{ group_id: 'g3', teacher_id: 't1' }]);
  });

  test('no asigna grupos a un administrador', async () => {
    await expect(setUserGroups({ id: 'a', role: 'admin', groups: [] }, [])).rejects.toThrow('Solo alumnos');
  });

  test('propaga el error de escritura', async () => {
    fake.result.error = { code: '42501' };
    await expect(setUserGroups({ id: 's1', role: 'student', groups: [] }, ['g1'])).rejects.toThrow('No se pudo completar');
  });
});
