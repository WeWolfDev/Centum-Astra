// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const fake = vi.hoisted(() => ({
  listVideoCatalog: vi.fn(),
  openVideo: vi.fn(),
  reportVideo: vi.fn(),
}));

vi.mock('../../lib/supabaseClient', () => ({ isSupabaseConfigured: true, supabase: null }));
vi.mock('../../context/AuthContext', () => ({ useAuth: () => ({ user: { id: 'al1', role: 'student' } }) }));
vi.mock('../../lib/videoService', async () => {
  const real = await vi.importActual('../../lib/videoService');
  return { ...real, ...fake };
});

const { default: VideoLibrary } = await import('./VideoLibrary');

const VIDEOS = [
  { id: 'v1', title: 'Ecuaciones lineales', moduleId: 'm1', moduleTitle: 'Pensamiento matemático', sessionId: 's1', sessionTitle: 'Clase 1: álgebra' },
  { id: 'v2', title: 'Ideas principales', moduleId: 'm2', moduleTitle: 'Comprensión lectora', sessionId: 's2', sessionTitle: 'Clase 3: textos' },
];

beforeEach(() => {
  Object.values(fake).forEach(fn => fn.mockReset());
  fake.listVideoCatalog.mockResolvedValue(VIDEOS);
  fake.reportVideo.mockResolvedValue();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('Videoteca con Supabase', () => {
  test('muestra el catálogo real con materia y clase, sin vistas ni duración', async () => {
    render(<VideoLibrary />);
    expect(await screen.findByText('Ecuaciones lineales')).toBeInTheDocument();
    expect(screen.getByText('Clase 1: álgebra')).toBeInTheDocument();
    expect(screen.getByText('2 videos')).toBeInTheDocument();
    expect(screen.getByText(/Drive te pedirá entrar con el correo registrado/)).toBeInTheDocument();
    expect(screen.queryByText(/vistas|Duración|\d+:\d{2}/)).not.toBeInTheDocument();
  });

  test('filtra por materia y busca sin importar acentos', async () => {
    const usuario = userEvent.setup();
    render(<VideoLibrary />);
    await screen.findByText('Ecuaciones lineales');
    await usuario.click(within(screen.getByRole('group', { name: 'Filtrar por materia' })).getByRole('button', { name: 'Comprensión lectora' }));
    expect(screen.queryByText('Ecuaciones lineales')).not.toBeInTheDocument();
    expect(screen.getByText('1 video')).toBeInTheDocument();
    await usuario.click(screen.getByRole('button', { name: 'Todas' }));
    await usuario.type(screen.getByLabelText('Buscar video'), 'algebra');
    expect(screen.getByText('Ecuaciones lineales')).toBeInTheDocument();
    expect(screen.queryByText('Ideas principales')).not.toBeInTheDocument();
    await usuario.type(screen.getByLabelText('Buscar video'), 'zzz');
    expect(screen.getByText('No se encontraron videos con esos filtros.')).toBeInTheDocument();
  });

  test('al ver un video pide el enlace a la base y lo abre en otra pestaña', async () => {
    const pestana = { location: { href: '' }, close: vi.fn(), opener: window };
    vi.spyOn(window, 'open').mockReturnValue(pestana);
    fake.openVideo.mockResolvedValue('https://drive.google.com/file/d/a/view');
    render(<VideoLibrary />);
    await userEvent.setup().click(await screen.findByRole('button', { name: /^Ver Ecuaciones lineales/ }));
    await waitFor(() => expect(pestana.location.href).toBe('https://drive.google.com/file/d/a/view'));
    expect(fake.openVideo).toHaveBeenCalledWith('v1');
    expect(pestana.opener).toBeNull();
  });

  test('si el video ya no está disponible, lo explica y cierra la pestaña', async () => {
    const pestana = { location: { href: '' }, close: vi.fn() };
    vi.spyOn(window, 'open').mockReturnValue(pestana);
    fake.openVideo.mockRejectedValue(new Error('Este video ya no está disponible.'));
    render(<VideoLibrary />);
    await userEvent.setup().click(await screen.findByRole('button', { name: /^Ver Ecuaciones lineales/ }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Este video ya no está disponible.');
    expect(pestana.close).toHaveBeenCalled();
  });

  test('reporta un problema con motivo y comentario', async () => {
    const usuario = userEvent.setup();
    render(<VideoLibrary />);
    await usuario.click(await screen.findByRole('button', { name: 'Reportar problema con Ecuaciones lineales' }));
    const dialogo = within(screen.getByRole('dialog'));
    await usuario.click(dialogo.getByLabelText('Drive me pide permiso'));
    await usuario.type(dialogo.getByLabelText('Comentario (opcional)'), 'Me pide otra cuenta');
    await usuario.click(dialogo.getByRole('button', { name: 'Enviar reporte' }));
    await waitFor(() => expect(fake.reportVideo).toHaveBeenCalledWith('v1', { reason: 'sin_permiso', note: 'Me pide otra cuenta' }, 'al1'));
    expect(await screen.findByText('Gracias. El administrador revisará el video.')).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  test('si ya lo había reportado, se lo dice sin cerrar el diálogo', async () => {
    const usuario = userEvent.setup();
    fake.reportVideo.mockRejectedValue(new Error('Ya reportaste este video; el administrador lo revisará.'));
    render(<VideoLibrary />);
    await usuario.click(await screen.findByRole('button', { name: 'Reportar problema con Ideas principales' }));
    const dialogo = within(screen.getByRole('dialog'));
    await usuario.click(dialogo.getByRole('button', { name: 'Enviar reporte' }));
    expect(await dialogo.findByRole('alert')).toHaveTextContent('Ya reportaste este video');
    expect(fake.reportVideo).toHaveBeenCalledWith('v2', { reason: 'no_carga', note: '' }, 'al1');
  });

  test('avisa si no hay videos y muestra el error de carga con reintento', async () => {
    fake.listVideoCatalog.mockResolvedValueOnce([]);
    const { unmount } = render(<VideoLibrary />);
    expect(await screen.findByText('Todavía no hay videos publicados en tus áreas.')).toBeInTheDocument();
    unmount();
    fake.listVideoCatalog.mockRejectedValueOnce(new Error('No pudimos cargar los videos. Intenta de nuevo.'));
    render(<VideoLibrary />);
    expect(await screen.findByText('No pudimos cargar los videos. Intenta de nuevo.')).toBeInTheDocument();
    await userEvent.setup().click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(await screen.findByText('Ecuaciones lineales')).toBeInTheDocument();
  });
});
