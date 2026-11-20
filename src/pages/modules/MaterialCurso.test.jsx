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
const CLASES = {
  sessions: [
    {
      id: 's1',
      title: 'Ecuaciones',
      materials: [
        { id: 'mat1', title: 'Video de ecuaciones', kind: 'video_link', url: 'https://drive.google.com/v' },
        { id: 'mat2', title: 'Guía', kind: 'external_link', url: 'javascript:alert(1)' },
      ],
    },
    { id: 's2', title: 'Geometría', materials: [] },
  ],
  nextPosition: 2,
};

beforeEach(() => {
  fake.usuario.current = { id: 'u1', role: 'teacher' };
  Object.entries(fake).forEach(([nombre, fn]) => { if (nombre !== 'usuario') fn.mockReset(); });
  fake.listMaterialCourses.mockResolvedValue(CURSOS);
  fake.listModuleSessions.mockResolvedValue(CLASES);
  ['createSession', 'renameSession', 'archiveSession', 'addLink', 'retireMaterial'].forEach(n => fake[n].mockResolvedValue());
});

afterEach(cleanup);

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
    await usuario.type(dialogo.getByLabelText('Nombre de la clase'), 'Probabilidad');
    await usuario.click(dialogo.getByRole('button', { name: 'Crear clase' }));
    await waitFor(() => expect(fake.createSession).toHaveBeenCalledWith('m1', 'Probabilidad', 2));
    expect(await screen.findByText('Clase creada.')).toBeInTheDocument();
    expect(fake.listModuleSessions).toHaveBeenCalledTimes(2);
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
    await waitFor(() => expect(fake.retireMaterial).toHaveBeenCalledWith('mat1'));
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
});
