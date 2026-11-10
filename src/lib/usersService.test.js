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
  // Consultas de lectura: registra cada llamada encadenada y responde en orden.
  const queries = [];
  const respuestas = [];
  function consulta(tabla, argsSelect) {
    const q = { tabla, select: argsSelect, llamadas: [] };
    queries.push(q);
    const chain = { then: (ok, ko) => Promise.resolve(respuestas.shift() ?? { data: [], count: 0, error: null }).then(ok, ko) };
    ['eq', 'neq', 'or', 'order', 'range', 'limit'].forEach(metodo => {
      chain[metodo] = (...args) => { q.llamadas.push([metodo, ...args]); return chain; };
    });
    return chain;
  }
  const from = vi.fn(tabla => ({ ...builder, select: (...args) => consulta(tabla, args) }));
  return { calls, result, invoke, queries, respuestas, supabase: { from, functions: { invoke } } };
});

vi.mock('./supabaseClient', () => ({ supabase: fake.supabase }));

const {
  PAGE_SIZE, getDirectorySummary, listGroups, listMyStudents, listUsers, runAdminAction, setUserGroups, toUserRow,
} = await import('./usersService');

beforeEach(() => {
  fake.calls.upsert.length = 0;
  fake.calls.remove.length = 0;
  fake.calls.insert.length = 0;
  fake.result.error = null;
  fake.invoke.mockReset();
  fake.queries.length = 0;
  fake.respuestas.length = 0;
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

const PERFIL = { id: '1', full_name: 'Ana', email: 'a@x.mx', role: 'student', status: 'active', created_at: 'hoy' };

describe('listUsers', () => {
  test('pide la página al servidor y devuelve el total real', async () => {
    fake.respuestas.push({ data: [PERFIL], count: 1500, error: null });
    const { users, total } = await listUsers({ page: 2 });
    const consulta = fake.queries[0];
    expect(consulta.select[1]).toEqual({ count: 'exact' });
    expect(consulta.llamadas).toContainEqual(['range', 2 * PAGE_SIZE, 3 * PAGE_SIZE - 1]);
    expect(users).toHaveLength(1);
    expect(total).toBe(1500);
  });

  test('filtra por rol y busca por nombre o correo en el servidor', async () => {
    await listUsers({ search: ' ana ', role: 'teacher' });
    const { llamadas } = fake.queries[0];
    expect(llamadas).toContainEqual(['eq', 'role', 'teacher']);
    expect(llamadas).toContainEqual(['or', 'full_name.ilike."%ana%",email.ilike."%ana%"']);
  });

  test('escapa comodines y comillas del texto buscado', async () => {
    await listUsers({ search: 'a_b%"c' });
    const [, filtro] = fake.queries[0].llamadas.find(([metodo]) => metodo === 'or');
    expect(filtro).toContain('"%a\\\\_b\\\\%\\"c%"');
  });

  test('sin búsqueda ni rol no agrega filtros', async () => {
    await listUsers();
    const metodos = fake.queries[0].llamadas.map(([metodo]) => metodo);
    expect(metodos).not.toContain('or');
    expect(metodos).not.toContain('eq');
  });

  test('una página fuera de rango se informa sin fallar', async () => {
    fake.respuestas.push({ data: null, count: null, error: { code: 'PGRST103' } });
    await expect(listUsers({ page: 9 })).resolves.toEqual({ users: [], total: 0, outOfRange: true });
  });

  test('un error del servidor muestra el mensaje de carga', async () => {
    fake.respuestas.push({ data: null, count: null, error: { code: '500' } });
    await expect(listUsers()).rejects.toThrow('No pudimos cargar');
  });
});

describe('listMyStudents', () => {
  test('limita a alumnos y pagina igual que el administrador', async () => {
    fake.respuestas.push({ data: [PERFIL], count: 40, error: null });
    const { total } = await listMyStudents({ search: 'ana', page: 1 });
    const { llamadas } = fake.queries[0];
    expect(llamadas).toContainEqual(['eq', 'role', 'student']);
    expect(llamadas).toContainEqual(['range', PAGE_SIZE, 2 * PAGE_SIZE - 1]);
    expect(total).toBe(40);
  });
});

describe('getDirectorySummary', () => {
  test('cuenta en el servidor sin traer todas las filas', async () => {
    [1200, 900, 30, 12].forEach(count => fake.respuestas.push({ count, error: null }));
    fake.respuestas.push({ data: [PERFIL], error: null });
    const resumen = await getDirectorySummary();
    expect(resumen).toMatchObject({ totalStudents: 1200, activeStudents: 900, activeTeachers: 30, activeGroups: 12 });
    expect(resumen.recent).toHaveLength(1);
    expect(fake.queries.slice(0, 4).every(q => q.select[1].head === true)).toBe(true);
  });

  test('falla con el mensaje de carga si un conteo falla', async () => {
    fake.respuestas.push({ count: null, error: { code: '500' } });
    await expect(getDirectorySummary()).rejects.toThrow('No pudimos cargar');
  });
});

describe('listGroups', () => {
  const grupo = n => ({ id: `g${n}`, name: `G${n}`, code: 'c', course_id: 'c1', courses: { name: 'Curso' } });

  test('lee en lotes y no se detiene en 1000 grupos', async () => {
    fake.respuestas.push({ data: Array.from({ length: 1000 }, (_, i) => grupo(i)), error: null });
    fake.respuestas.push({ data: [grupo(1000)], error: null });
    const grupos = await listGroups();
    expect(grupos).toHaveLength(1001);
    expect(fake.queries[1].llamadas).toContainEqual(['range', 1000, 1999]);
    expect(grupos[0]).toMatchObject({ id: 'g0', course: 'Curso', courseId: 'c1' });
  });

  test('falla con el mensaje de carga', async () => {
    fake.respuestas.push({ data: null, error: { code: '500' } });
    await expect(listGroups()).rejects.toThrow('No pudimos cargar');
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
