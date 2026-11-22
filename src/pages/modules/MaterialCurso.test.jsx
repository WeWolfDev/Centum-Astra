// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const fake = vi.hoisted(() => ({
  usuario: { current: { id: 'u1', role: 'teacher' } },
  listMaterialCourses: vi.fn(),
  listModuleSessions: vi.fn(),
  createSession: vi.fn(),
  renameSession: vi.fn(),
  archiveSession: vi.fn(),
  addLink: vi.fn(),
  retireMaterial: vi.fn(),
  createTopic: vi.fn(),
  renameTopic: vi.fn(),
  archiveTopic: vi.fn(),
  addFile: vi.fn(),
  replaceFile: vi.fn(),
  retryFile: vi.fn(),
  openFile: vi.fn(),
}));

vi.mock('../../context/AuthContext', () => ({ useAuth: () => ({ user: fake.usuario.current }) }));
vi.mock('../../lib/materialService', async () => {
  const real = await vi.importActual('../../lib/materialService');
  const { usuario: _usuario, ...servicio } = fake;
  return { ...real, ...servicio };
});

const { default: MaterialCurso } = await import('./MaterialCurso');

const CURSOS = [
  { id: 'c1', name: 'Curso 2027', modules: [{ id: 'm1', title: 'Pensamiento matemático' }, { id: 'm2', title: 'Premedicina' }] },
  { id: 'c2', name: 'Curso sin áreas', modules: [] },
];
const SESIONES = [
  {
    id: 's1',
    title: 'Ecuaciones',
    materials: [
      { id: 'mat1', title: 'Video de ecuaciones', kind: 'video_link', url: 'https://drive.google.com/v' },
      { id: 'mat2', title: 'Guía', kind: 'external_link', url: 'javascript:alert(1)' },
    ],
  },
  { id: 's2', title: 'Geometría', materials: [] },
];
const CLASES = {
  topics: [
    { id: 't1', title: 'Álgebra', sessions: SESIONES },
    { id: 't2', title: 'Probabilidad', sessions: [] },
  ],
  sessions: SESIONES,
  nextPosition: 2,
  nextTopicPosition: 2,
};

beforeEach(() => {
  fake.usuario.current = { id: 'u1', role: 'teacher' };
  Object.entries(fake).forEach(([nombre, fn]) => { if (nombre !== 'usuario') fn.mockReset(); });
  fake.listMaterialCourses.mockResolvedValue(CURSOS);
  fake.listModuleSessions.mockResolvedValue(CLASES);
  ['createSession', 'renameSession', 'archiveSession', 'addLink', 'retireMaterial', 'createTopic', 'renameTopic', 'archiveTopic',
    'addFile', 'replaceFile', 'retryFile']
    .forEach(n => fake[n].mockResolvedValue());
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

// Archivos (#81): uno propio publicado, uno ajeno y una carga que no terminó.
const ARCHIVOS = [
  { id: 'doc1', title: 'Guía PDF', kind: 'document', storagePath: 'doc1/guia.pdf', fileName: 'guia.pdf', fileSize: 2048, fileVersion: 1, status: 'published', createdBy: 'u1' },
  { id: 'doc2', title: 'Mapa ajeno', kind: 'image', storagePath: 'doc2/mapa.png', fileName: 'mapa.png', fileSize: 10, fileVersion: 1, status: 'published', createdBy: 'u9' },
  { id: 'doc3', title: 'Tarea', kind: 'document', storagePath: 'doc3/tarea.pdf', fileVersion: 0, status: 'draft', createdBy: 'u1' },
];
const CLASES_CON_ARCHIVOS = {
  topics: [{ id: 't1', title: 'Álgebra', sessions: [{ id: 's3', title: 'Funciones', materials: ARCHIVOS }] }],
  sessions: [],
  nextPosition: 1,
  nextTopicPosition: 1,
};

function archivo(nombre, type = 'application/pdf', size) {
  const file = new File(['contenido'], nombre, { type });
  if (size !== undefined) Object.defineProperty(file, 'size', { value: size });
  return file;
}

async function abrirClase(nombre) {
  const usuario = userEvent.setup();
  await usuario.click(await screen.findByRole('button', { name: new RegExp(`^${nombre}`) }));
  return usuario;
}

describe('MaterialCurso', () => {
  test('muestra las áreas del curso y las clases del área activa', async () => {
    render(<MaterialCurso />);
    expect(screen.getByRole('status')).toHaveTextContent('Cargando');
    expect(await screen.findByRole('tab', { name: /Premedicina/ })).toBeInTheDocument();
    expect(await screen.findByText('Ecuaciones')).toBeInTheDocument();
    expect(screen.getByText('2 recursos')).toBeInTheDocument();
    expect(screen.getByText('Sin material')).toBeInTheDocument();
    expect(fake.listModuleSessions).toHaveBeenCalledTimes(1);
    expect(fake.listModuleSessions).toHaveBeenCalledWith('m1');
  });

  test('carga las clases de otra área al cambiar de pestaña', async () => {
    const usuario = userEvent.setup();
    render(<MaterialCurso />);
    await screen.findByText('Ecuaciones');
    await usuario.click(screen.getByRole('tab', { name: /Premedicina/ }));
    await waitFor(() => expect(fake.listModuleSessions).toHaveBeenLastCalledWith('m2'));
  });

  test('abre solo enlaces http(s) en otra pestaña', async () => {
    render(<MaterialCurso />);
    await abrirClase('Ecuaciones');
    const enlaces = screen.getAllByRole('link');
    expect(enlaces).toHaveLength(1);
    expect(enlaces[0]).toHaveAttribute('href', 'https://drive.google.com/v');
    expect(enlaces[0]).toHaveAttribute('rel', 'noopener noreferrer');
    expect(screen.getByText('Guía')).toBeInTheDocument();
  });

  test('el profesor crea una clase en la siguiente posición', async () => {
    const usuario = userEvent.setup();
    render(<MaterialCurso />);
    await screen.findByText('Ecuaciones');
    await usuario.click(screen.getByRole('button', { name: /Nueva clase/ }));
    const dialogo = within(screen.getByRole('dialog'));
    await usuario.selectOptions(dialogo.getByLabelText('Tema'), 't2');
    await usuario.type(dialogo.getByLabelText('Nombre de la clase'), 'Eventos');
    await usuario.click(dialogo.getByRole('button', { name: 'Crear clase' }));
    await waitFor(() => expect(fake.createSession).toHaveBeenCalledWith('m1', 'Eventos', 2, 't2'));
    expect(await screen.findByText('Clase creada.')).toBeInTheDocument();
    expect(fake.listModuleSessions).toHaveBeenCalledTimes(2);
  });

  test('agrupa las clases por tema', async () => {
    render(<MaterialCurso />);
    const algebra = await screen.findByRole('region', { name: /Álgebra/ });
    expect(within(algebra).getByText('2 clases')).toBeInTheDocument();
    expect(within(algebra).getByRole('button', { name: /^Ecuaciones/ })).toBeInTheDocument();
    const probabilidad = screen.getByRole('region', { name: /Probabilidad/ });
    expect(within(probabilidad).getByText('Este tema todavía no tiene clases.')).toBeInTheDocument();
  });

  test('crea y renombra temas del módulo', async () => {
    const usuario = userEvent.setup();
    render(<MaterialCurso />);
    await screen.findByText('Ecuaciones');
    await usuario.click(screen.getByRole('button', { name: /Nuevo tema/ }));
    await usuario.type(within(screen.getByRole('dialog')).getByLabelText('Nombre del tema'), 'Geometría analítica');
    await usuario.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Crear tema' }));
    await waitFor(() => expect(fake.createTopic).toHaveBeenCalledWith({ courseId: 'c1', moduleId: 'm1' }, 'Geometría analítica', 2));
    expect(await screen.findByText('Tema creado.')).toBeInTheDocument();

    await usuario.click(screen.getByRole('button', { name: 'Renombrar tema Álgebra' }));
    const campo = within(screen.getByRole('dialog')).getByLabelText('Nombre del tema');
    expect(campo).toHaveValue('Álgebra');
    await usuario.clear(campo);
    await usuario.type(campo, 'Álgebra básica');
    await usuario.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Guardar' }));
    await waitFor(() => expect(fake.renameTopic).toHaveBeenCalledWith('t1', 'Álgebra básica'));
  });

  test('solo se archiva un tema sin clases, tras confirmar', async () => {
    const usuario = userEvent.setup();
    render(<MaterialCurso />);
    await screen.findByText('Ecuaciones');
    expect(screen.getByRole('button', { name: 'Archivar tema Álgebra' })).toBeDisabled();
    await usuario.click(screen.getByRole('button', { name: 'Archivar tema Probabilidad' }));
    await usuario.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Archivar' }));
    await waitFor(() => expect(fake.archiveTopic).toHaveBeenCalledWith('t2'));
    expect(await screen.findByText('Tema archivado.')).toBeInTheDocument();
  });

  test('si la base rechaza archivar el tema, lo explica', async () => {
    const usuario = userEvent.setup();
    fake.archiveTopic.mockRejectedValueOnce(new Error('Mueve o retira sus clases antes de archivar el tema.'));
    render(<MaterialCurso />);
    await screen.findByText('Ecuaciones');
    await usuario.click(screen.getByRole('button', { name: 'Archivar tema Probabilidad' }));
    await usuario.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Archivar' }));
    expect(await screen.findByText('Mueve o retira sus clases antes de archivar el tema.')).toBeInTheDocument();
  });

  test('un módulo sin temas crea su primera clase sin elegir tema', async () => {
    const usuario = userEvent.setup();
    fake.listModuleSessions.mockResolvedValue({ topics: [], sessions: [], nextPosition: 0, nextTopicPosition: 0 });
    render(<MaterialCurso />);
    expect(await screen.findByText(/si no eliges tema, queda en "General"/)).toBeInTheDocument();
    await usuario.click(screen.getByRole('button', { name: /Nueva clase/ }));
    expect(within(screen.getByRole('dialog')).queryByLabelText('Tema')).not.toBeInTheDocument();
    await usuario.type(within(screen.getByRole('dialog')).getByLabelText('Nombre de la clase'), 'Introducción');
    await usuario.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Crear clase' }));
    await waitFor(() => expect(fake.createSession).toHaveBeenCalledWith('m1', 'Introducción', 0, null));
  });

  test('renombra una clase', async () => {
    const usuario = userEvent.setup();
    render(<MaterialCurso />);
    await screen.findByText('Ecuaciones');
    await usuario.click(screen.getByRole('button', { name: 'Renombrar Ecuaciones' }));
    const campo = within(screen.getByRole('dialog')).getByLabelText('Nombre de la clase');
    expect(campo).toHaveValue('Ecuaciones');
    await usuario.clear(campo);
    await usuario.type(campo, 'Ecuaciones lineales');
    await usuario.click(screen.getByRole('button', { name: 'Guardar' }));
    await waitFor(() => expect(fake.renameSession).toHaveBeenCalledWith('s1', 'Ecuaciones lineales'));
  });

  test('publica un enlace a nombre del usuario y deja el error a la vista si falla', async () => {
    fake.addLink.mockRejectedValueOnce(new Error('Escribe un enlace válido que empiece con https://'));
    render(<MaterialCurso />);
    const usuario = await abrirClase('Geometría');
    await usuario.click(screen.getByRole('button', { name: /Agregar enlace/ }));
    const dialogo = within(screen.getByRole('dialog'));
    await usuario.selectOptions(dialogo.getByLabelText('Tipo'), 'external_link');
    await usuario.type(dialogo.getByLabelText('Título'), 'Resumen');
    await usuario.type(dialogo.getByLabelText('Enlace'), 'https://docs.google.com/r');
    await usuario.click(dialogo.getByRole('button', { name: 'Publicar' }));
    expect(await dialogo.findByRole('alert')).toHaveTextContent('enlace válido');
    await usuario.click(dialogo.getByRole('button', { name: 'Publicar' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(fake.addLink).toHaveBeenLastCalledWith('s2', { title: 'Resumen', url: 'https://docs.google.com/r', kind: 'external_link' }, 'u1');
    expect(await screen.findByText('Enlace publicado.')).toBeInTheDocument();
  });

  test('el profesor no ve las acciones para retirar', async () => {
    render(<MaterialCurso />);
    await abrirClase('Ecuaciones');
    expect(screen.queryByRole('button', { name: 'Retirar' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Retirar clase' })).not.toBeInTheDocument();
  });

  test('el administrador retira material tras confirmar', async () => {
    fake.usuario.current = { id: 'a1', role: 'admin' };
    render(<MaterialCurso />);
    const usuario = await abrirClase('Ecuaciones');
    await usuario.click(screen.getAllByRole('button', { name: 'Retirar' })[0]);
    const dialogo = within(screen.getByRole('dialog'));
    expect(dialogo.getByText(/dejarán de ver "Video de ecuaciones"/)).toBeInTheDocument();
    await usuario.click(dialogo.getByRole('button', { name: 'Retirar' }));
    await waitFor(() => expect(fake.retireMaterial).toHaveBeenCalledWith('mat1', undefined));
    expect(await screen.findByText('Material retirado.')).toBeInTheDocument();
  });

  test('el administrador retira una clase y ve el error si falla', async () => {
    fake.usuario.current = { id: 'a1', role: 'admin' };
    fake.archiveSession.mockRejectedValue(new Error('No tienes permiso para hacer este cambio.'));
    render(<MaterialCurso />);
    const usuario = await abrirClase('Ecuaciones');
    await usuario.click(screen.getByRole('button', { name: 'Retirar clase' }));
    await usuario.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Retirar' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('No tienes permiso');
    expect(fake.archiveSession).toHaveBeenCalledWith('s1');
  });

  test('cancelar la confirmación no retira nada', async () => {
    fake.usuario.current = { id: 'a1', role: 'admin' };
    render(<MaterialCurso />);
    const usuario = await abrirClase('Ecuaciones');
    await usuario.click(screen.getByRole('button', { name: 'Retirar clase' }));
    await usuario.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Cancelar' }));
    expect(fake.archiveSession).not.toHaveBeenCalled();
  });

  test('cambia de curso y avisa si no tiene áreas', async () => {
    const usuario = userEvent.setup();
    render(<MaterialCurso />);
    await screen.findByText('Ecuaciones');
    await usuario.selectOptions(screen.getByLabelText('Curso'), 'c2');
    expect(screen.getByText(/todavía no tiene módulos/)).toBeInTheDocument();
  });

  test('avisa si el módulo no tiene clases', async () => {
    fake.listModuleSessions.mockResolvedValue({ sessions: [], nextPosition: 0 });
    render(<MaterialCurso />);
    expect(await screen.findByText(/todavía no tiene clases/)).toBeInTheDocument();
  });

  test('avisa si no hay cursos asignados', async () => {
    fake.listMaterialCourses.mockResolvedValue([]);
    render(<MaterialCurso />);
    expect(await screen.findByText(/no tienes cursos activos/)).toBeInTheDocument();
    expect(screen.queryByLabelText('Curso')).not.toBeInTheDocument();
  });

  test('muestra el error de carga y permite reintentar', async () => {
    const usuario = userEvent.setup();
    fake.listMaterialCourses.mockRejectedValueOnce(new Error('No pudimos cargar el material. Intenta de nuevo.'));
    render(<MaterialCurso />);
    expect(await screen.findByText('No pudimos cargar el material. Intenta de nuevo.')).toBeInTheDocument();
    await usuario.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(await screen.findByText('Ecuaciones')).toBeInTheDocument();
  });

  describe('archivos', () => {
    test('el profesor sube un archivo y se publica al confirmar', async () => {
      const pdf = archivo('Resumen.pdf');
      render(<MaterialCurso />);
      const usuario = await abrirClase('Geometría');
      await usuario.click(screen.getByRole('button', { name: /Subir archivo/ }));
      const dialogo = within(screen.getByRole('dialog'));
      await usuario.type(dialogo.getByLabelText('Título'), 'Resumen');
      await usuario.upload(dialogo.getByLabelText('Archivo'), pdf);
      await usuario.click(dialogo.getByRole('button', { name: 'Subir y publicar' }));
      await waitFor(() => expect(fake.addFile).toHaveBeenCalledWith('s2', { title: 'Resumen', file: pdf }, 'u1'));
      expect(await screen.findByText('Archivo publicado.')).toBeInTheDocument();
    });

    test('rechaza ejecutables y archivos de más de 50 MB sin crear el material', async () => {
      render(<MaterialCurso />);
      const usuario = await abrirClase('Geometría');
      await usuario.click(screen.getByRole('button', { name: /Subir archivo/ }));
      const dialogo = within(screen.getByRole('dialog'));
      await usuario.type(dialogo.getByLabelText('Título'), 'Programa');
      await usuario.upload(dialogo.getByLabelText('Archivo'), archivo('setup.exe', 'application/x-msdownload'));
      expect(dialogo.getByRole('alert')).toHaveTextContent('No se permiten archivos ejecutables.');
      await usuario.click(dialogo.getByRole('button', { name: 'Subir y publicar' }));
      await usuario.upload(dialogo.getByLabelText('Archivo'), archivo('video.pdf', 'application/pdf', 50 * 1024 * 1024 + 1));
      expect(dialogo.getByRole('alert')).toHaveTextContent('El archivo pesa más de 50 MB.');
      await usuario.click(dialogo.getByRole('button', { name: 'Subir y publicar' }));
      expect(fake.addFile).not.toHaveBeenCalled();
    });

    test('si la subida falla, deja el error a la vista y recarga para mostrar la carga incompleta', async () => {
      fake.addFile.mockRejectedValueOnce(new Error('No se pudo subir el archivo. Intenta de nuevo.'));
      render(<MaterialCurso />);
      const usuario = await abrirClase('Geometría');
      await usuario.click(screen.getByRole('button', { name: /Subir archivo/ }));
      const dialogo = within(screen.getByRole('dialog'));
      await usuario.type(dialogo.getByLabelText('Título'), 'Resumen');
      await usuario.upload(dialogo.getByLabelText('Archivo'), archivo('Resumen.pdf'));
      await usuario.click(dialogo.getByRole('button', { name: 'Subir y publicar' }));
      expect(await dialogo.findByRole('alert')).toHaveTextContent('No se pudo subir el archivo');
      expect(fake.listModuleSessions).toHaveBeenCalledTimes(2);
    });

    test('muestra tamaño, carga incompleta y solo deja gestionar los archivos propios al profesor', async () => {
      fake.listModuleSessions.mockResolvedValue(CLASES_CON_ARCHIVOS);
      render(<MaterialCurso />);
      await abrirClase('Funciones');
      expect(screen.getByText('2 KB')).toBeInTheDocument();
      expect(screen.getByText('Carga incompleta')).toBeInTheDocument();
      expect(screen.getAllByRole('button', { name: 'Reemplazar' })).toHaveLength(1);
      expect(screen.getAllByRole('button', { name: 'Reintentar' })).toHaveLength(1);
      expect(screen.queryByRole('button', { name: /^Abrir Tarea/ })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Retirar' })).not.toBeInTheDocument();
    });

    test('abre el archivo con una URL firmada en otra pestaña', async () => {
      const pestana = { location: { href: '' }, close: vi.fn(), opener: window };
      vi.spyOn(window, 'open').mockReturnValue(pestana);
      fake.openFile.mockResolvedValue('https://firmada/guia.pdf');
      fake.listModuleSessions.mockResolvedValue(CLASES_CON_ARCHIVOS);
      render(<MaterialCurso />);
      const usuario = await abrirClase('Funciones');
      await usuario.click(screen.getByRole('button', { name: /^Abrir Guía PDF/ }));
      await waitFor(() => expect(pestana.location.href).toBe('https://firmada/guia.pdf'));
      expect(fake.openFile).toHaveBeenCalledWith('doc1');
      expect(pestana.opener).toBeNull();
    });

    test('si no se puede abrir, cierra la pestaña y explica el error', async () => {
      const pestana = { location: { href: '' }, close: vi.fn(), opener: null };
      vi.spyOn(window, 'open').mockReturnValue(pestana);
      fake.openFile.mockRejectedValue(new Error('Este archivo ya no está disponible.'));
      fake.listModuleSessions.mockResolvedValue(CLASES_CON_ARCHIVOS);
      render(<MaterialCurso />);
      const usuario = await abrirClase('Funciones');
      await usuario.click(screen.getByRole('button', { name: /^Abrir Guía PDF/ }));
      expect(await screen.findByText('Este archivo ya no está disponible.')).toBeInTheDocument();
      expect(pestana.close).toHaveBeenCalled();
    });

    test('reemplaza con un archivo del mismo formato y rechaza otro formato', async () => {
      fake.listModuleSessions.mockResolvedValue(CLASES_CON_ARCHIVOS);
      render(<MaterialCurso />);
      const usuario = await abrirClase('Funciones');
      await usuario.click(screen.getByRole('button', { name: 'Reemplazar' }));
      const dialogo = within(screen.getByRole('dialog'));
      expect(dialogo.getByText(/El archivo anterior se borra/)).toBeInTheDocument();
      await usuario.upload(dialogo.getByLabelText('Archivo'), archivo('guia.docx', 'application/msword'));
      expect(dialogo.getByRole('alert')).toHaveTextContent('El archivo nuevo debe ser .pdf, igual que el anterior.');
      const nuevo = archivo('guia-v2.pdf');
      await usuario.upload(dialogo.getByLabelText('Archivo'), nuevo);
      await usuario.click(dialogo.getByRole('button', { name: 'Reemplazar' }));
      await waitFor(() => expect(fake.replaceFile).toHaveBeenCalledWith(ARCHIVOS[0], nuevo));
      expect(await screen.findByText('Archivo reemplazado.')).toBeInTheDocument();
    });

    test('termina una carga incompleta y la publica', async () => {
      fake.listModuleSessions.mockResolvedValue(CLASES_CON_ARCHIVOS);
      const pdf = archivo('tarea.pdf');
      render(<MaterialCurso />);
      const usuario = await abrirClase('Funciones');
      await usuario.click(screen.getByRole('button', { name: 'Reintentar' }));
      const dialogo = within(screen.getByRole('dialog'));
      expect(dialogo.getByText(/La carga anterior no terminó/)).toHaveTextContent('tarea.pdf');
      await usuario.upload(dialogo.getByLabelText('Archivo'), pdf);
      await usuario.click(dialogo.getByRole('button', { name: 'Subir y publicar' }));
      await waitFor(() => expect(fake.retryFile).toHaveBeenCalledWith(ARCHIVOS[2], pdf));
      expect(await screen.findByText('Archivo publicado.')).toBeInTheDocument();
    });

    test('el administrador reemplaza cualquier archivo y ve si el borrado falla al retirar', async () => {
      fake.usuario.current = { id: 'a1', role: 'admin' };
      fake.listModuleSessions.mockResolvedValue(CLASES_CON_ARCHIVOS);
      fake.retireMaterial.mockRejectedValueOnce(new Error('El material se retiró, pero el archivo no se pudo borrar. Intenta de nuevo.'));
      render(<MaterialCurso />);
      const usuario = await abrirClase('Funciones');
      expect(screen.getAllByRole('button', { name: 'Reemplazar' })).toHaveLength(2);
      await usuario.click(screen.getAllByRole('button', { name: 'Retirar' })[0]);
      await usuario.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Retirar' }));
      await waitFor(() => expect(fake.retireMaterial).toHaveBeenCalledWith('doc1', 'doc1/guia.pdf'));
      expect(await screen.findByRole('alert')).toHaveTextContent('el archivo no se pudo borrar');
    });
  });
});
