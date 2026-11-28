import { beforeEach, describe, expect, test, vi } from 'vitest';

// Simula supabase.from(): registra cada llamada encadenada y responde en orden.
const fake = vi.hoisted(() => {
  const consultas = [];
  const respuestas = [];
  function from(tabla) {
    const q = { tabla, llamadas: [] };
    consultas.push(q);
    const chain = {
      then: (ok, ko) => Promise.resolve(respuestas.shift() ?? { data: null, error: null }).then(ok, ko),
    };
    ['select', 'insert', 'update', 'eq', 'order', 'limit', 'single'].forEach(metodo => {
      chain[metodo] = (...args) => { q.llamadas.push([metodo, ...args]); return chain; };
    });
    return chain;
  }
  const storage = { subidas: [], borrados: [], errorSubida: null };
  const bucket = {
    upload: vi.fn(async (ruta, archivo, opciones) => { storage.subidas.push([ruta, archivo, opciones]); return { error: storage.errorSubida }; }),
    remove: vi.fn(async rutas => { storage.borrados.push(...rutas); return { error: null }; }),
    getPublicUrl: ruta => ({ data: { publicUrl: `https://x.supabase.co/storage/v1/object/public/modulos/${ruta}` } }),
  };
  return { consultas, respuestas, storage, supabase: { from: vi.fn(from), storage: { from: vi.fn(() => bucket) } } };
});

vi.mock('./supabaseClient', () => ({ supabase: fake.supabase }));

const {
  HORARIOS_SUGERIDOS,
  cambiarImagenModulo,
  imagenModuloUrl,
  createCourse,
  createGroup,
  createModule,
  listCatalog,
  setStatus,
  updateCourse,
  updateGroup,
  updateModule,
} = await import('./catalogoService');

const llamada = (q, metodo) => q.llamadas.find(([m]) => m === metodo)?.slice(1);

beforeEach(() => {
  fake.consultas.length = 0;
  fake.respuestas.length = 0;
  fake.storage.subidas.length = 0;
  fake.storage.borrados.length = 0;
  fake.storage.errorSubida = null;
});

describe('listCatalog', () => {
  const CURSO = {
    id: 'c1', name: 'Curso', description: null, status: 'active', starts_on: '2027-01-10', ends_on: '2027-06-30',
    groups: [
      { id: 'g2', name: 'Sabatino', code: 'S', schedule: 'Sábados', status: 'active' },
      { id: 'g1', name: 'Archivado', code: 'A', schedule: null, status: 'archived' },
    ],
    modules: [
      { id: 'm2', title: 'Segundo', description: null, position: 1, status: 'active' },
      { id: 'm1', title: 'Primero', description: null, position: 0, status: 'active' },
    ],
  };

  test('devuelve cursos con grupos y módulos en orden, sin archivados', async () => {
    fake.respuestas.push({ data: [CURSO, { ...CURSO, id: 'c2', status: 'archived' }], error: null });
    const cursos = await listCatalog();
    expect(cursos).toHaveLength(1);
    expect(cursos[0]).toMatchObject({ id: 'c1', startsOn: '2027-01-10', endsOn: '2027-06-30' });
    expect(cursos[0].groups.map(g => g.id)).toEqual(['g2']);
    expect(cursos[0].modules.map(m => m.id)).toEqual(['m1', 'm2']);
  });

  test('con includeArchived incluye cursos, grupos y módulos archivados', async () => {
    fake.respuestas.push({ data: [CURSO, { ...CURSO, id: 'c2', status: 'archived' }], error: null });
    const cursos = await listCatalog({ includeArchived: true });
    expect(cursos.map(c => c.id)).toEqual(['c1', 'c2']);
    expect(cursos[0].groups).toHaveLength(2);
  });

  test('informa el error de carga', async () => {
    fake.respuestas.push({ data: null, error: { code: 'XX000' } });
    await expect(listCatalog()).rejects.toThrow('No pudimos cargar');
  });
});

describe('cursos', () => {
  test('crea un curso con nombre limpio y fechas', async () => {
    await createCourse({ name: '  Curso 2027  ', description: '', startsOn: '2027-01-10', endsOn: '2027-06-30' });
    expect(llamada(fake.consultas[0], 'insert')[0]).toEqual({
      name: 'Curso 2027', description: null, starts_on: '2027-01-10', ends_on: '2027-06-30',
    });
  });

  test('pide nombre', async () => {
    await expect(createCourse({ name: '   ' })).rejects.toThrow('Escribe el nombre del curso.');
    expect(fake.consultas).toHaveLength(0);
  });

  test('valida que la fecha de fin no sea anterior a la de inicio', async () => {
    await expect(createCourse({ name: 'Curso', startsOn: '2027-06-30', endsOn: '2027-01-10' }))
      .rejects.toThrow('La fecha de fin no puede ser anterior a la de inicio.');
  });

  test('edita un curso y marca la fecha de actualización', async () => {
    await updateCourse('c1', { name: 'Nuevo', description: 'Desc', startsOn: '', endsOn: '' });
    const [cambios] = llamada(fake.consultas[0], 'update');
    expect(cambios).toMatchObject({ name: 'Nuevo', description: 'Desc', starts_on: null, ends_on: null });
    expect(cambios.updated_at).toEqual(expect.any(String));
    expect(llamada(fake.consultas[0], 'eq')).toEqual(['id', 'c1']);
  });

  test('traduce un permiso denegado', async () => {
    fake.respuestas.push({ error: { code: '42501' } });
    await expect(createCourse({ name: 'Curso' })).rejects.toThrow('No tienes permiso');
  });
});

describe('grupos', () => {
  test('ofrece los horarios del cliente como sugerencia', () => {
    expect(HORARIOS_SUGERIDOS).toEqual([
      'Entre semana: martes y jueves, 7:00 a 9:00 p. m.',
      'Sabatino: sábados, 8:00 a. m. a 12:00 p. m.',
    ]);
  });

  test('crea un grupo con horario libre', async () => {
    await createGroup({ courseId: 'c1', name: ' Grupo A ', code: ' a1 ', schedule: ' Domingos, 9:00 a 13:00 ' });
    expect(fake.consultas[0].tabla).toBe('groups');
    expect(llamada(fake.consultas[0], 'insert')[0]).toEqual({
      course_id: 'c1', name: 'Grupo A', code: 'a1', schedule: 'Domingos, 9:00 a 13:00', generation: null,
    });
  });

  test('guarda la generación del grupo y limita su largo', async () => {
    await createGroup({ courseId: 'c1', name: 'A', code: 'A', schedule: 'S', generation: ' 2027 ' });
    expect(llamada(fake.consultas[0], 'insert')[0]).toMatchObject({ generation: '2027' });
    await expect(createGroup({ courseId: 'c1', name: 'A', code: 'A', schedule: 'S', generation: 'x'.repeat(61) }))
      .rejects.toThrow('La generación admite hasta 60 caracteres.');
  });

  test('pide nombre, código y horario', async () => {
    await expect(createGroup({ courseId: 'c1', name: 'A', code: 'A', schedule: '  ' }))
      .rejects.toThrow('Escribe el horario del grupo.');
    await expect(createGroup({ courseId: 'c1', name: 'A', code: ' ', schedule: 'S' }))
      .rejects.toThrow('Escribe el código del grupo.');
  });

  test('avisa si el código ya existe en el curso', async () => {
    fake.respuestas.push({ error: { code: '23505' } });
    await expect(createGroup({ courseId: 'c1', name: 'A', code: 'A', schedule: 'S' }))
      .rejects.toThrow('Ya existe un grupo con ese código en este curso.');
  });

  test('edita el horario', async () => {
    await updateGroup('g1', { name: 'A', code: 'A', schedule: 'Sabatino' });
    expect(llamada(fake.consultas[0], 'update')[0]).toMatchObject({ schedule: 'Sabatino' });
  });
});

describe('módulos', () => {
  test('agrega el módulo al final del curso', async () => {
    fake.respuestas.push({ data: [{ position: 4 }], error: null });
    await createModule({ courseId: 'c1', title: ' Química ', description: '' });
    expect(llamada(fake.consultas[0], 'order')).toEqual(['position', { ascending: false }]);
    expect(llamada(fake.consultas[1], 'insert')[0]).toEqual({
      course_id: 'c1', title: 'Química', description: null, position: 5,
    });
  });

  test('el primer módulo de un curso va en la posición 0', async () => {
    fake.respuestas.push({ data: [], error: null });
    await createModule({ courseId: 'c1', title: 'Primero' });
    expect(llamada(fake.consultas[1], 'insert')[0].position).toBe(0);
  });

  test('si otra persona tomó la posición, reintenta una vez con la siguiente', async () => {
    fake.respuestas.push(
      { data: [{ position: 1 }], error: null },
      { error: { code: '23505' } },
      { data: [{ position: 2 }], error: null },
      { error: null },
    );
    await createModule({ courseId: 'c1', title: 'Tercero' });
    expect(llamada(fake.consultas[3], 'insert')[0].position).toBe(3);
  });

  test('pide título', async () => {
    await expect(createModule({ courseId: 'c1', title: '' })).rejects.toThrow('Escribe el título del módulo.');
  });

  test('edita un módulo', async () => {
    await updateModule('m1', { title: 'Biología', description: 'Célula' });
    expect(llamada(fake.consultas[0], 'update')[0]).toMatchObject({ title: 'Biología', description: 'Célula' });
  });
});

describe('setStatus', () => {
  test('archiva y reactiva en la tabla indicada', async () => {
    await setStatus('modules', 'm1', 'archived');
    expect(fake.consultas[0].tabla).toBe('modules');
    expect(llamada(fake.consultas[0], 'update')[0]).toMatchObject({ status: 'archived' });
  });

  test('solo acepta las tablas y estados del catálogo', async () => {
    await expect(setStatus('profiles', 'x', 'archived')).rejects.toThrow();
    await expect(setStatus('courses', 'x', 'deleted')).rejects.toThrow();
    expect(fake.consultas).toHaveLength(0);
  });
});

describe('imagen del módulo', () => {
  const png = new File(['x'], 'portada.png', { type: 'image/png' });

  test('crear un módulo devuelve su id para subir la imagen', async () => {
    fake.respuestas.push({ data: [], error: null }, { data: { id: 'm7' }, error: null });
    await expect(createModule({ courseId: 'c1', title: 'Química' })).resolves.toBe('m7');
  });

  test('sube la imagen en la carpeta del módulo, la guarda y borra la anterior', async () => {
    await cambiarImagenModulo('m1', { archivo: png, anterior: 'm1/viejo.jpg' });
    const [ruta, archivo, opciones] = fake.storage.subidas[0];
    expect(ruta).toMatch(/^m1\/\d+\.png$/);
    expect(archivo).toBe(png);
    expect(opciones).toEqual({ contentType: 'image/png', upsert: false });
    expect(llamada(fake.consultas[0], 'update')[0]).toMatchObject({ image_path: ruta });
    expect(fake.storage.borrados).toEqual(['m1/viejo.jpg']);
  });

  test('quitar la imagen deja el módulo con la del área', async () => {
    await cambiarImagenModulo('m1', { quitar: true, anterior: 'm1/viejo.jpg' });
    expect(fake.storage.subidas).toEqual([]);
    expect(llamada(fake.consultas[0], 'update')[0]).toMatchObject({ image_path: null });
    expect(fake.storage.borrados).toEqual(['m1/viejo.jpg']);
  });

  test('sin cambios no llama a la base', async () => {
    await cambiarImagenModulo('m1', {});
    expect(fake.consultas).toEqual([]);
  });

  test('rechaza otros tipos y archivos de más de 5 MB', async () => {
    await expect(cambiarImagenModulo('m1', { archivo: new File(['x'], 'a.gif', { type: 'image/gif' }) }))
      .rejects.toThrow('JPG, PNG o WebP');
    const grande = new File(['x'], 'a.png', { type: 'image/png' });
    Object.defineProperty(grande, 'size', { value: 6 * 1024 * 1024 });
    await expect(cambiarImagenModulo('m1', { archivo: grande })).rejects.toThrow('5 MB');
    expect(fake.storage.subidas).toEqual([]);
  });

  test('si la subida falla no cambia el módulo', async () => {
    fake.storage.errorSubida = { message: 'x' };
    await expect(cambiarImagenModulo('m1', { archivo: png })).rejects.toThrow('No se pudo subir la imagen');
    expect(fake.consultas).toEqual([]);
  });

  test('si guardar la ruta falla, borra la imagen recién subida y conserva la anterior', async () => {
    fake.respuestas.push({ error: { code: '42501' } });
    await expect(cambiarImagenModulo('m1', { archivo: png, anterior: 'm1/viejo.jpg' })).rejects.toThrow('permiso');
    expect(fake.storage.borrados).toEqual([fake.storage.subidas[0][0]]);
  });

  test('la URL pública sale de la ruta; sin ruta no hay URL', () => {
    expect(imagenModuloUrl('m1/a.png')).toBe('https://x.supabase.co/storage/v1/object/public/modulos/m1/a.png');
    expect(imagenModuloUrl(null)).toBeNull();
  });
});
