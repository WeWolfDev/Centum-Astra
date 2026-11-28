import { beforeEach, describe, expect, test, vi } from 'vitest';

const fake = vi.hoisted(() => {
  const calls = { insert: [], update: [], filtros: [], rpc: [], storage: [] };
  const respuestas = {
    lectura: { data: [], error: null },
    porTabla: {},
    escritura: { error: null },
    rpc: {},
    storage: { upload: { error: null }, remove: { error: null }, createSignedUrl: { data: { signedUrl: 'https://firmada' }, error: null } },
  };
  const cadena = respuesta => {
    const chain = {
      eq: (c, v) => { calls.filtros.push([c, v]); return chain; },
      order: () => chain,
      then: (ok, ko) => Promise.resolve(respuesta()).then(ok, ko),
    };
    return chain;
  };
  const from = vi.fn(tabla => ({
    select: () => cadena(() => respuestas.porTabla[tabla] ?? respuestas.lectura),
    insert: fila => { calls.insert.push([tabla, fila]); return Promise.resolve(respuestas.escritura); },
    update: cambios => { calls.update.push([tabla, cambios]); return cadena(() => respuestas.escritura); },
  }));
  const rpc = vi.fn((nombre, args) => {
    calls.rpc.push([nombre, args]);
    return Promise.resolve(respuestas.rpc[nombre] ?? { data: null, error: null });
  });
  const storage = {
    from: bucket => ({
      upload: (ruta, file, opciones) => { calls.storage.push(['upload', bucket, ruta, opciones]); return Promise.resolve(respuestas.storage.upload); },
      remove: rutas => { calls.storage.push(['remove', bucket, rutas]); return Promise.resolve(respuestas.storage.remove); },
      createSignedUrl: (ruta, segundos) => { calls.storage.push(['createSignedUrl', bucket, ruta, segundos]); return Promise.resolve(respuestas.storage.createSignedUrl); },
    }),
  };
  return { calls, respuestas, supabase: { from, rpc, storage } };
});

vi.mock('./supabaseClient', () => ({ supabase: fake.supabase }));

const {
  addFile, addLink, esEnlaceDrive, archiveSession, cargaIncompleta, problemaDeArchivo, retryFile, tamanoLegible, createSession, dismissFileNotice, enlaceSeguro, esEjecutable, listFileNotices,
  listMaterialCourses, listModuleSessions, nombreSeguro, openFile, renameSession, replaceFile, retireMaterial, updateLink,
  archiveTopic, createTopic, renameTopic,
} = await import('./materialService');

beforeEach(() => {
  fake.calls.insert.length = 0;
  fake.calls.update.length = 0;
  fake.calls.filtros.length = 0;
  fake.calls.rpc.length = 0;
  fake.calls.storage.length = 0;
  fake.respuestas.lectura = { data: [], error: null };
  fake.respuestas.porTabla = {};
  fake.respuestas.escritura = { error: null };
  fake.respuestas.rpc = {};
  fake.respuestas.storage.upload = { error: null };
  fake.respuestas.storage.remove = { error: null };
  fake.respuestas.storage.createSignedUrl = { data: { signedUrl: 'https://firmada' }, error: null };
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
      { id: 'c1', name: 'Curso', modules: [{ id: 'm1', title: 'Matemático', imageUrl: null }, { id: 'm2', title: 'Lectora', imageUrl: null }] },
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
    fake.respuestas.porTabla.topics = { data: [], error: null };
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
    expect(fake.calls.filtros).toEqual([['module_id', 'm1'], ['module_id', 'm1']]);
  });

  test('agrupa las clases por tema activo, en orden', async () => {
    fake.respuestas.porTabla.topics = {
      data: [
        { id: 't2', title: 'Geometría', position: 1, status: 'active' },
        { id: 't1', title: 'Álgebra', position: 0, status: 'active' },
        { id: 't3', title: 'Viejo', position: 5, status: 'archived' },
      ],
      error: null,
    };
    fake.respuestas.porTabla.sessions = {
      data: [
        { id: 's1', title: 'Ecuaciones', position: 0, status: 'active', topic_id: 't1', materials: [] },
        { id: 's2', title: 'Triángulos', position: 1, status: 'active', topic_id: 't2', materials: [] },
        { id: 's3', title: 'Polinomios', position: 2, status: 'active', topic_id: 't1', materials: [] },
      ],
      error: null,
    };

    const { topics, nextTopicPosition } = await listModuleSessions('m1');

    expect(topics.map(t => [t.title, t.sessions.map(s => s.title)])).toEqual([
      ['Álgebra', ['Ecuaciones', 'Polinomios']],
      ['Geometría', ['Triángulos']],
    ]);
    expect(nextTopicPosition).toBe(6);
  });

  test('un módulo sin clases empieza en la posición 0', async () => {
    await expect(listModuleSessions('m1')).resolves.toEqual({ topics: [], sessions: [], nextPosition: 0, nextTopicPosition: 0 });
  });

  test('informa un error de carga', async () => {
    fake.respuestas.lectura = { data: null, error: { message: 'x' } };
    await expect(listModuleSessions('m1')).rejects.toThrow(/cargar el material/);
  });
});

describe('temas', () => {
  test('crea, renombra y archiva un tema', async () => {
    await createTopic({ courseId: 'c1', moduleId: 'm1' }, '  Álgebra ', 2);
    await renameTopic('t1', 'Álgebra básica');
    await archiveTopic('t1');
    expect(fake.calls.insert).toEqual([['topics', { course_id: 'c1', module_id: 'm1', title: 'Álgebra', position: 2 }]]);
    expect(fake.calls.update[0]).toEqual(['topics', expect.objectContaining({ title: 'Álgebra básica' })]);
    expect(fake.calls.update[1]).toEqual(['topics', expect.objectContaining({ status: 'archived' })]);
  });

  test('exige nombre y explica por qué no se archiva un tema con clases', async () => {
    await expect(createTopic({ courseId: 'c1', moduleId: 'm1' }, ' ', 0)).rejects.toThrow('Agrega un nombre al tema.');
    await expect(renameTopic('t1', '')).rejects.toThrow('Agrega un nombre al tema.');
    fake.respuestas.escritura = { error: { code: 'CA031' } };
    await expect(archiveTopic('t1')).rejects.toThrow('Mueve o retira sus clases antes de archivar el tema.');
  });
});

describe('clases', () => {
  test('crea una clase con nombre limpio y posición', async () => {
    await createSession('m1', '  Clase nueva ', 3, 't1');
    await createSession('m1', 'Sin tema', 4);
    expect(fake.calls.insert).toEqual([
      ['sessions', { module_id: 'm1', title: 'Clase nueva', position: 3, topic_id: 't1' }],
      ['sessions', { module_id: 'm1', title: 'Sin tema', position: 4, topic_id: null }],
    ]);
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

  test('un video debe ser de Google Drive; un enlace de página no', async () => {
    await expect(addLink('s1', { ...ENLACE, url: 'https://www.youtube.com/watch?v=x' }, 'u1')).rejects.toThrow('Google Drive');
    await expect(addLink('s1', { ...ENLACE, url: 'https://drive.google.com.evil.mx/x' }, 'u1')).rejects.toThrow('Google Drive');
    expect(fake.calls.insert).toHaveLength(0);
    await addLink('s1', { ...ENLACE, kind: 'external_link', url: 'https://es.khanacademy.org/x' }, 'u1');
    expect(fake.calls.insert).toHaveLength(1);
  });

  test('esEnlaceDrive solo acepta https://drive.google.com', () => {
    expect(esEnlaceDrive('https://drive.google.com/file/d/a/view')).toBe(true);
    expect(esEnlaceDrive('http://drive.google.com/x')).toBe(false);
    expect(esEnlaceDrive('https://docs.google.com/x')).toBe(false);
    expect(esEnlaceDrive('no es enlace')).toBe(false);
  });

  test('traduce un valor inválido y un error genérico', async () => {
    fake.respuestas.escritura = { error: { code: '23514' } };
    await expect(addLink('s1', ENLACE, 'u1')).rejects.toThrow('Revisa los datos');
    fake.respuestas.escritura = { error: { code: 'XX' } };
    await expect(addLink('s1', ENLACE, 'u1')).rejects.toThrow('No se pudo guardar');
  });
});

describe('updateLink', () => {
  const VIDEO = { id: 'mat1', kind: 'video_link' };

  test('corrige el título y el enlace sin cambiar el tipo', async () => {
    await updateLink(VIDEO, { title: ' Video nuevo ', url: 'https://drive.google.com/nuevo' });
    const [tabla, cambios] = fake.calls.update[0];
    expect(tabla).toBe('materials');
    expect(cambios).toEqual({ title: 'Video nuevo', external_url: 'https://drive.google.com/nuevo', updated_at: expect.any(String) });
    expect(fake.calls.filtros).toEqual([['id', 'mat1']]);
  });

  test('aplica las mismas reglas que al agregar', async () => {
    await expect(updateLink(VIDEO, { title: '', url: 'https://drive.google.com/v' })).rejects.toThrow('Agrega un título.');
    await expect(updateLink(VIDEO, { title: 'Video', url: 'javascript:alert(1)' })).rejects.toThrow(/enlace válido/);
    await expect(updateLink(VIDEO, { title: 'Video', url: 'https://www.youtube.com/watch?v=x' })).rejects.toThrow('Google Drive');
    expect(fake.calls.update).toHaveLength(0);
    await updateLink({ id: 'mat2', kind: 'external_link' }, { title: 'Guía', url: 'https://es.khanacademy.org/x' });
    expect(fake.calls.update).toHaveLength(1);
  });

  test('traduce el permiso denegado', async () => {
    fake.respuestas.escritura = { error: { code: '42501' } };
    await expect(updateLink(VIDEO, { title: 'Video', url: 'https://drive.google.com/v' })).rejects.toThrow('No tienes permiso');
  });
});

describe('retireMaterial', () => {
  test('archiva el material', async () => {
    await retireMaterial('mat1');
    expect(fake.calls.update[0]).toEqual(['materials', expect.objectContaining({ status: 'archived' })]);
    expect(fake.calls.filtros).toEqual([['id', 'mat1']]);
    expect(fake.calls.storage).toEqual([]);
  });

  test('después de archivar borra el archivo', async () => {
    await retireMaterial('mat1', 'mat1/guia.pdf');
    expect(fake.calls.storage).toEqual([['remove', 'materiales', ['mat1/guia.pdf']]]);
  });

  test('si el archivo no se borra, lo informa', async () => {
    fake.respuestas.storage.remove = { error: { message: 'x' } };
    await expect(retireMaterial('mat1', 'mat1/guia.pdf')).rejects.toThrow(/no se pudo borrar/);
  });
});

const pdf = (nombre = 'Guía de álgebra.pdf', size = 1024, type = 'application/pdf') => ({ name: nombre, size, type });

describe('validación de archivos', () => {
  test('reconoce ejecutables por extensión', () => {
    expect(esEjecutable('setup.EXE')).toBe(true);
    expect(esEjecutable('tareas.pdf.sh')).toBe(true);
    expect(esEjecutable('virus.exe.')).toBe(true);
    expect(esEjecutable('virus.exe . ')).toBe(true);
    for (const nombre of ['tarea.js', 'a.jse', 'a.hta', 'acceso.lnk', 'a.reg', 'a.msp', 'a.msix', 'a.appx', 'a.scf', 'a.psm1', 'a.ws', 'a.wsh', 'a.gadget']) {
      expect(esEjecutable(nombre)).toBe(true);
    }
    expect(esEjecutable('tareas.zip')).toBe(false);
    expect(esEjecutable('LEEME')).toBe(false);
  });

  test('limpia el nombre para la ruta de Storage', () => {
    expect(nombreSeguro('Guía de álgebra (1).pdf')).toBe('Guia-de-algebra-1-.pdf');
    expect(nombreSeguro('...')).toBe('archivo');
    expect(nombreSeguro('virus.exe. ')).toBe('virus.exe');
  });
});

describe('addFile', () => {
  test('registra el borrador, sube y confirma publicando', async () => {
    await addFile('s1', { title: ' Guía ', file: pdf() }, 'u1');
    const [tabla, fila] = fake.calls.insert[0];
    expect(tabla).toBe('materials');
    expect(fila).toMatchObject({ session_id: 's1', title: 'Guía', kind: 'document', status: 'draft', created_by: 'u1' });
    expect(fila.storage_path).toBe(`${fila.id}/Guia-de-algebra.pdf`);
    expect(fake.calls.storage).toEqual([
      ['upload', 'materiales', fila.storage_path, { upsert: false, contentType: 'application/pdf' }],
    ]);
    expect(fake.calls.rpc).toEqual([['confirm_material_file', { target_material: fila.id, publish: true }]]);
  });

  test('una imagen se registra como imagen', async () => {
    await addFile('s1', { title: 'Mapa', file: pdf('mapa.png', 10, 'image/png') }, 'u1');
    expect(fake.calls.insert[0][1].kind).toBe('image');
  });

  test('rechaza ejecutables, archivos de más de 50 MB y la falta de archivo antes de tocar la base', async () => {
    await expect(addFile('s1', { title: 'X', file: pdf('setup.exe') }, 'u1')).rejects.toThrow(/ejecutables/);
    await expect(addFile('s1', { title: 'X', file: pdf('setup.exe.') }, 'u1')).rejects.toThrow(/ejecutables/);
    await expect(addFile('s1', { title: 'X', file: pdf('a.pdf', 50 * 1024 * 1024 + 1) }, 'u1')).rejects.toThrow(/50 MB/);
    await expect(addFile('s1', { title: 'X' }, 'u1')).rejects.toThrow('Elige un archivo.');
    expect(fake.calls.insert).toHaveLength(0);
  });

  test('si la carga falla no se confirma ni se publica', async () => {
    fake.respuestas.storage.upload = { error: { message: 'x' } };
    await expect(addFile('s1', { title: 'Guía', file: pdf() }, 'u1')).rejects.toThrow(/subir el archivo/);
    expect(fake.calls.rpc).toEqual([]);
  });

  test('traduce el rechazo de un ejecutable al confirmar', async () => {
    fake.respuestas.rpc.confirm_material_file = { error: { code: 'CA003' } };
    await expect(addFile('s1', { title: 'Guía', file: pdf('a.zip', 1, 'application/zip') }, 'u1')).rejects.toThrow(/ejecutables/);
  });
});

describe('replaceFile', () => {
  test('sobrescribe en la misma ruta y confirma sin cambiar el estado', async () => {
    await replaceFile({ id: 'mat1', storagePath: 'mat1/guia.pdf' }, pdf('otra.pdf'));
    expect(fake.calls.storage).toEqual([
      ['upload', 'materiales', 'mat1/guia.pdf', { upsert: true, contentType: 'application/pdf' }],
    ]);
    expect(fake.calls.rpc).toEqual([['confirm_material_file', { target_material: 'mat1', publish: false }]]);
  });

  test('rechaza un archivo de otro formato sin subir nada', async () => {
    await expect(replaceFile({ id: 'mat1', storagePath: 'mat1/guia.pdf' }, pdf('guia.docx')))
      .rejects.toThrow('El archivo nuevo debe ser .pdf, igual que el anterior.');
    await expect(replaceFile({ id: 'mat1', storagePath: 'mat1/LEEME' }, pdf('LEEME.txt')))
      .rejects.toThrow('mismo formato');
    expect(fake.calls.storage).toEqual([]);
  });

  test('acepta la misma extensión aunque cambie mayúsculas', async () => {
    await replaceFile({ id: 'mat1', storagePath: 'mat1/guia.pdf' }, pdf('Guia nueva.PDF'));
    expect(fake.calls.storage).toHaveLength(1);
  });

  test('exige que el material tenga archivo', async () => {
    await expect(replaceFile({ id: 'mat1' }, pdf())).rejects.toThrow(/no tiene archivo/);
  });
});

describe('openFile', () => {
  test('registra la apertura y devuelve una URL firmada de corta duración', async () => {
    fake.respuestas.rpc.open_material_file = { data: 'mat1/guia.pdf', error: null };
    await expect(openFile('mat1')).resolves.toBe('https://firmada');
    expect(fake.calls.rpc).toEqual([['open_material_file', { target_material: 'mat1' }]]);
    expect(fake.calls.storage).toEqual([['createSignedUrl', 'materiales', 'mat1/guia.pdf', 300]]);
  });

  test('avisa si el archivo ya no está disponible', async () => {
    fake.respuestas.rpc.open_material_file = { data: null, error: { code: 'CA004' } };
    await expect(openFile('mat1')).rejects.toThrow(/ya no está disponible/);
  });
});

describe('avisos de archivos', () => {
  test('lista los avisos de reemplazo o borrado', async () => {
    fake.respuestas.rpc.my_material_notices = {
      data: [{ material_id: 'mat1', title: 'Guía', change: 'replaced', changed_at: '2026-11-21' }], error: null,
    };
    await expect(listFileNotices()).resolves.toEqual([
      { materialId: 'mat1', title: 'Guía', change: 'replaced', changedAt: '2026-11-21' },
    ]);
  });

  test('cierra un aviso', async () => {
    await dismissFileNotice('mat1');
    expect(fake.calls.rpc).toEqual([['dismiss_material_notice', { target_material: 'mat1' }]]);
  });
});

describe('retryFile', () => {
  test('sube a la ruta del borrador y confirma publicando', async () => {
    await retryFile({ id: 'mat1', storagePath: 'mat1/guia.pdf' }, pdf('guia.pdf'));
    expect(fake.calls.storage).toEqual([
      ['upload', 'materiales', 'mat1/guia.pdf', { upsert: true, contentType: 'application/pdf' }],
    ]);
    expect(fake.calls.rpc).toEqual([['confirm_material_file', { target_material: 'mat1', publish: true }]]);
  });

  test('exige el mismo formato y que el material tenga archivo', async () => {
    await expect(retryFile({ id: 'mat1', storagePath: 'mat1/guia.pdf' }, pdf('guia.png', 1, 'image/png'))).rejects.toThrow('.pdf');
    await expect(retryFile({ id: 'mat1' }, pdf())).rejects.toThrow(/no tiene archivo/);
    expect(fake.calls.storage).toEqual([]);
  });
});

describe('ayudas de archivos', () => {
  test('problemaDeArchivo explica por qué no se puede subir', () => {
    expect(problemaDeArchivo(null)).toBe('Elige un archivo.');
    expect(problemaDeArchivo(pdf('a.pdf'))).toBeNull();
    expect(problemaDeArchivo(pdf('a.pdf'), 'x/b.pdf')).toBeNull();
    expect(problemaDeArchivo(pdf('a.docx'), 'x/b.pdf')).toMatch('.pdf');
  });

  test('cargaIncompleta reconoce el borrador sin archivo confirmado', () => {
    expect(cargaIncompleta({ storagePath: 'x/a.pdf', status: 'draft', fileVersion: 0 })).toBe(true);
    expect(cargaIncompleta({ storagePath: 'x/a.pdf', status: 'published', fileVersion: 1 })).toBe(false);
    expect(cargaIncompleta({ status: 'draft' })).toBe(false);
  });

  test('tamanoLegible', () => {
    expect(tamanoLegible(500)).toBe('500 B');
    expect(tamanoLegible(2048)).toBe('2 KB');
    expect(tamanoLegible(5 * 1024 * 1024)).toBe('5.0 MB');
    expect(tamanoLegible(undefined)).toBe('');
  });
});
