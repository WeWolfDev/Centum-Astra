import { beforeEach, describe, expect, test, vi } from 'vitest';

const fake = vi.hoisted(() => {
  const calls = { insert: [], update: [], filtros: [] };
  const respuestas = { lectura: { data: [], error: null }, escritura: { error: null } };
  const cadena = respuesta => {
    const chain = {
      eq: (c, v) => { calls.filtros.push([c, v]); return chain; },
      order: () => chain,
      then: (ok, ko) => Promise.resolve(respuesta()).then(ok, ko),
    };
    return chain;
  };
  const from = vi.fn(tabla => ({
    select: () => cadena(() => respuestas.lectura),
    insert: fila => { calls.insert.push([tabla, fila]); return Promise.resolve(respuestas.escritura); },
    update: cambios => { calls.update.push([tabla, cambios]); return cadena(() => respuestas.escritura); },
  }));
  return { calls, respuestas, supabase: { from } };
});

vi.mock('./supabaseClient', () => ({ supabase: fake.supabase }));

const {
  addLink, archiveSession, createSession, enlaceSeguro, listMaterialCourses, listModuleSessions, renameSession, retireMaterial,
} = await import('./materialService');

beforeEach(() => {
  fake.calls.insert.length = 0;
  fake.calls.update.length = 0;
  fake.calls.filtros.length = 0;
  fake.respuestas.lectura = { data: [], error: null };
  fake.respuestas.escritura = { error: null };
});

describe('enlaceSeguro', () => {
  test('acepta http(s) y rechaza otros esquemas', () => {
    expect(enlaceSeguro(' https://drive.google.com/x ')).toBe('https://drive.google.com/x');
    expect(enlaceSeguro('http://a.mx')).toBe('http://a.mx/');
    expect(enlaceSeguro('javascript:alert(1)')).toBeNull();
    expect(enlaceSeguro('no es enlace')).toBeNull();
    expect(enlaceSeguro(undefined)).toBeNull();
  });
});

describe('listMaterialCourses', () => {
  test('devuelve cursos activos con sus módulos activos en orden', async () => {
    fake.respuestas.lectura.data = [{
      id: 'c1', name: 'Curso', status: 'active',
      modules: [
        { id: 'm2', title: 'Lectora', position: 1, status: 'active' },
        { id: 'm1', title: 'Matemático', position: 0, status: 'active' },
        { id: 'm3', title: 'Viejo', position: 2, status: 'archived' },
      ],
    }, { id: 'c2', name: 'Sin módulos', status: 'active', modules: null }];
    await expect(listMaterialCourses()).resolves.toEqual([
      { id: 'c1', name: 'Curso', modules: [{ id: 'm1', title: 'Matemático' }, { id: 'm2', title: 'Lectora' }] },
      { id: 'c2', name: 'Sin módulos', modules: [] },
    ]);
    expect(fake.calls.filtros).toEqual([['status', 'active']]);
  });

  test('informa un error de carga', async () => {
    fake.respuestas.lectura = { data: null, error: { message: 'x' } };
    await expect(listMaterialCourses()).rejects.toThrow(/cargar el material/);
  });
});

describe('listModuleSessions', () => {
  test('devuelve clases activas, material vigente en orden y la siguiente posición', async () => {
    fake.respuestas.lectura.data = [
      {
        id: 's1', title: 'Clase 1', position: 0, status: 'active',
        materials: [
          { id: 'b', title: 'Segundo', kind: 'external_link', external_url: 'https://b', status: 'published', created_by: 'u', created_at: '2026-02' },
          { id: 'a', title: 'Primero', kind: 'video_link', external_url: 'https://a', status: 'published', created_by: 'u', created_at: '2026-01' },
          { id: 'x', title: 'Retirado', kind: 'video_link', external_url: 'https://x', status: 'archived', created_by: 'u', created_at: '2026-03' },
        ],
      },
      { id: 's2', title: 'Archivada', position: 4, status: 'archived', materials: [] },
      { id: 's3', title: 'Sin material', position: 1, status: 'active', materials: null },
    ];
    const resultado = await listModuleSessions('m1');
    expect(resultado.nextPosition).toBe(5);
    expect(resultado.sessions.map(s => s.title)).toEqual(['Clase 1', 'Sin material']);
    expect(resultado.sessions[0].materials).toEqual([
      { id: 'a', title: 'Primero', kind: 'video_link', url: 'https://a', status: 'published', createdBy: 'u' },
      { id: 'b', title: 'Segundo', kind: 'external_link', url: 'https://b', status: 'published', createdBy: 'u' },
    ]);
    expect(fake.calls.filtros).toEqual([['module_id', 'm1']]);
  });

  test('un módulo sin clases empieza en la posición 0', async () => {
    await expect(listModuleSessions('m1')).resolves.toEqual({ sessions: [], nextPosition: 0 });
  });

  test('informa un error de carga', async () => {
    fake.respuestas.lectura = { data: null, error: { message: 'x' } };
    await expect(listModuleSessions('m1')).rejects.toThrow(/cargar el material/);
  });
});

describe('clases', () => {
  test('crea una clase con nombre limpio y posición', async () => {
    await createSession('m1', '  Clase nueva ', 3);
    expect(fake.calls.insert).toEqual([['sessions', { module_id: 'm1', title: 'Clase nueva', position: 3 }]]);
  });

  test('exige nombre', async () => {
    await expect(createSession('m1', '  ', 0)).rejects.toThrow('Agrega un nombre a la clase.');
    await expect(renameSession('s1', '')).rejects.toThrow('Agrega un nombre a la clase.');
    expect(fake.calls.insert).toHaveLength(0);
  });

  test('renombra y archiva', async () => {
    await renameSession('s1', 'Otro nombre');
    await archiveSession('s1');
    expect(fake.calls.update[0][1]).toMatchObject({ title: 'Otro nombre' });
    expect(fake.calls.update[1][1]).toMatchObject({ status: 'archived' });
    expect(fake.calls.filtros).toEqual([['id', 's1'], ['id', 's1']]);
  });

  test('traduce el permiso denegado', async () => {
    fake.respuestas.escritura = { error: { code: '42501' } };
    await expect(createSession('m1', 'Clase', 0)).rejects.toThrow('No tienes permiso');
  });
});

describe('addLink', () => {
  const ENLACE = { title: ' Video ', url: 'https://drive.google.com/v', kind: 'video_link' };

  test('publica el enlace a nombre de quien lo agrega', async () => {
    await addLink('s1', ENLACE, 'u1');
    const [tabla, fila] = fake.calls.insert[0];
    expect(tabla).toBe('materials');
    expect(fila).toMatchObject({
      session_id: 's1', title: 'Video', kind: 'video_link', external_url: 'https://drive.google.com/v',
      status: 'published', created_by: 'u1', published_by: 'u1',
    });
    expect(fila.published_at).toEqual(expect.any(String));
  });

  test('rechaza enlaces que no son http(s), sin título o de tipo desconocido', async () => {
    await expect(addLink('s1', { ...ENLACE, url: 'javascript:alert(1)' }, 'u1')).rejects.toThrow(/enlace válido/);
    await expect(addLink('s1', { ...ENLACE, title: '' }, 'u1')).rejects.toThrow('Agrega un título.');
    await expect(addLink('s1', { ...ENLACE, kind: 'document' }, 'u1')).rejects.toThrow('Elige el tipo de enlace.');
    expect(fake.calls.insert).toHaveLength(0);
  });

  test('traduce un valor inválido y un error genérico', async () => {
    fake.respuestas.escritura = { error: { code: '23514' } };
    await expect(addLink('s1', ENLACE, 'u1')).rejects.toThrow('Revisa los datos');
    fake.respuestas.escritura = { error: { code: 'XX' } };
    await expect(addLink('s1', ENLACE, 'u1')).rejects.toThrow('No se pudo guardar');
  });
});

describe('retireMaterial', () => {
  test('archiva el material', async () => {
    await retireMaterial('mat1');
    expect(fake.calls.update[0]).toEqual(['materials', expect.objectContaining({ status: 'archived' })]);
    expect(fake.calls.filtros).toEqual([['id', 'mat1']]);
  });
});
