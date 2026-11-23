import { beforeEach, describe, expect, test, vi } from 'vitest';

const fake = vi.hoisted(() => {
  const calls = { select: [], filtros: [], insert: [], update: [], rpc: [] };
  const respuestas = { lectura: { data: [], error: null }, escritura: { error: null }, rpc: { data: null, error: null } };
  const cadena = respuesta => {
    const chain = {
      eq: (c, v) => { calls.filtros.push(['eq', c, v]); return chain; },
      is: (c, v) => { calls.filtros.push(['is', c, v]); return chain; },
      order: (c, o) => { calls.filtros.push(['order', c, o]); return chain; },
      then: (ok, ko) => Promise.resolve(respuesta()).then(ok, ko),
    };
    return chain;
  };
  const from = vi.fn(tabla => ({
    select: columnas => { calls.select.push([tabla, columnas]); return cadena(() => respuestas.lectura); },
    insert: fila => { calls.insert.push([tabla, fila]); return Promise.resolve(respuestas.escritura); },
    update: cambios => { calls.update.push([tabla, cambios]); return cadena(() => respuestas.escritura); },
  }));
  const rpc = vi.fn((nombre, args) => { calls.rpc.push([nombre, args]); return Promise.resolve(respuestas.rpc); });
  return { calls, respuestas, supabase: { from, rpc } };
});

vi.mock('./supabaseClient', () => ({ supabase: fake.supabase }));

const { listOpenReports, listVideoCatalog, openVideo, reportVideo, resolveReports } = await import('./videoService');

beforeEach(() => {
  Object.values(fake.calls).forEach(lista => { lista.length = 0; });
  fake.respuestas.lectura = { data: [], error: null };
  fake.respuestas.escritura = { error: null };
  fake.respuestas.rpc = { data: null, error: null };
});

const fila = (id, sesion = 'active', modulo = 'active') => ({
  id,
  title: `Video ${id}`,
  created_by: 'p1',
  created_at: '2026-11-20',
  sessions: { id: 's1', title: 'Clase 1', status: sesion, modules: { id: 'm1', title: 'Matemático', status: modulo } },
});

describe('listVideoCatalog', () => {
  test('pide solo videos publicados, sin la URL, y omite clases o módulos archivados', async () => {
    fake.respuestas.lectura.data = [fila('v1'), fila('v2', 'archived'), fila('v3', 'active', 'archived')];
    await expect(listVideoCatalog()).resolves.toEqual([{
      id: 'v1', title: 'Video v1', moduleId: 'm1', moduleTitle: 'Matemático', sessionId: 's1', sessionTitle: 'Clase 1',
      createdBy: 'p1', createdAt: '2026-11-20',
    }]);
    const [[tabla, columnas]] = fake.calls.select;
    expect(tabla).toBe('materials');
    expect(columnas).not.toMatch('external_url');
    expect(fake.calls.filtros).toEqual([
      ['eq', 'kind', 'video_link'],
      ['eq', 'status', 'published'],
      ['order', 'created_at', { ascending: false }],
    ]);
  });

  test('informa un error de carga', async () => {
    fake.respuestas.lectura = { data: null, error: { message: 'x' } };
    await expect(listVideoCatalog()).rejects.toThrow('No pudimos cargar los videos');
  });
});

describe('openVideo', () => {
  test('devuelve el enlace que entrega la base al registrar la apertura', async () => {
    fake.respuestas.rpc = { data: 'https://drive.google.com/file/d/a/view', error: null };
    await expect(openVideo('v1')).resolves.toBe('https://drive.google.com/file/d/a/view');
    expect(fake.calls.rpc).toEqual([['open_material_link', { target_material: 'v1' }]]);
  });

  test('distingue un video no disponible de otro error', async () => {
    fake.respuestas.rpc = { data: null, error: { code: 'CA004' } };
    await expect(openVideo('v1')).rejects.toThrow('Este video ya no está disponible.');
    fake.respuestas.rpc = { data: null, error: { code: 'XX' } };
    await expect(openVideo('v1')).rejects.toThrow('No pudimos abrir el video');
  });
});

describe('reportVideo', () => {
  test('guarda el reporte a nombre de quien lo hace, con comentario limpio', async () => {
    await reportVideo('v1', { reason: 'sin_permiso', note: '  Me pide otra cuenta  ' }, 'a1');
    expect(fake.calls.insert).toEqual([['material_reports', {
      material_id: 'v1', reporter_id: 'a1', reason: 'sin_permiso', note: 'Me pide otra cuenta',
    }]]);
  });

  test('sin comentario guarda null', async () => {
    await reportVideo('v1', { reason: 'no_carga', note: '   ' }, 'a1');
    expect(fake.calls.insert[0][1].note).toBeNull();
  });

  test('valida motivo y largo antes de guardar', async () => {
    await expect(reportVideo('v1', { reason: 'spam' }, 'a1')).rejects.toThrow('Elige qué problema');
    await expect(reportVideo('v1', { reason: 'otro', note: 'x'.repeat(501) }, 'a1')).rejects.toThrow('500 caracteres');
    expect(fake.calls.insert).toEqual([]);
  });

  test('traduce el reporte repetido, el permiso negado y otros errores', async () => {
    fake.respuestas.escritura = { error: { code: '23505' } };
    await expect(reportVideo('v1', { reason: 'no_carga' }, 'a1')).rejects.toThrow('Ya reportaste este video');
    fake.respuestas.escritura = { error: { code: '42501' } };
    await expect(reportVideo('v1', { reason: 'no_carga' }, 'a1')).rejects.toThrow('No tienes permiso');
    fake.respuestas.escritura = { error: { code: 'XX' } };
    await expect(reportVideo('v1', { reason: 'no_carga' }, 'a1')).rejects.toThrow('No se pudo guardar');
  });
});

describe('reportes del administrador', () => {
  test('lista los reportes abiertos', async () => {
    fake.respuestas.lectura.data = [{ material_id: 'v1', reason: 'no_carga', created_at: '2026-11-21' }];
    await expect(listOpenReports()).resolves.toEqual([{ materialId: 'v1', reason: 'no_carga', createdAt: '2026-11-21' }]);
    expect(fake.calls.filtros).toEqual([['is', 'resolved_at', null]]);
  });

  test('informa un error al listar', async () => {
    fake.respuestas.lectura = { data: null, error: { message: 'x' } };
    await expect(listOpenReports()).rejects.toThrow('No pudimos cargar');
  });

  test('resuelve los reportes abiertos de un material a nombre del administrador', async () => {
    await resolveReports('v1', 'ad1');
    const [[tabla, cambios]] = fake.calls.update;
    expect(tabla).toBe('material_reports');
    expect(cambios).toEqual({ resolved_at: expect.any(String), resolved_by: 'ad1' });
    expect(fake.calls.filtros).toEqual([['eq', 'material_id', 'v1'], ['is', 'resolved_at', null]]);
  });

  test('traduce errores al resolver', async () => {
    fake.respuestas.escritura = { error: { code: '42501' } };
    await expect(resolveReports('v1', 'ad1')).rejects.toThrow('No tienes permiso');
    fake.respuestas.escritura = { error: { code: 'XX' } };
    await expect(resolveReports('v1', 'ad1')).rejects.toThrow('No se pudo guardar');
  });
});
