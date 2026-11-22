// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const fake = vi.hoisted(() => ({
  listMaterialCourses: vi.fn(),
  listModuleSessions: vi.fn(),
  listFileNotices: vi.fn(),
  dismissFileNotice: vi.fn(),
  openFile: vi.fn(),
}));

vi.mock('../../lib/supabaseClient', () => ({ isSupabaseConfigured: true, supabase: null }));
vi.mock('../../context/AuthContext', () => ({ useAuth: () => ({ user: { id: 'al1', role: 'student' } }) }));
vi.mock('../../lib/materialService', async () => {
  const real = await vi.importActual('../../lib/materialService');
  return { ...real, ...fake };
});

const { default: Modulos } = await import('./Modulos');

const CURSOS = [{ id: 'c1', name: 'Curso 2027', modules: [{ id: 'm1', title: 'Pensamiento matemático' }, { id: 'm2', title: 'Premedicina' }] }];
const GUIA = { id: 'f1', title: 'Guía', kind: 'document', storagePath: 'f1/guia.pdf', fileName: 'guia.pdf', fileSize: 2048, status: 'published' };
const CLASES = {
  topics: [
    {
      id: 't1',
      title: 'Álgebra',
      sessions: [{
        id: 's1',
        title: 'Ecuaciones',
        materials: [
          { id: 'v1', title: 'Video de ecuaciones', kind: 'video_link', url: 'https://drive.google.com/v' },
          GUIA,
          { id: 'x1', title: 'Malicioso', kind: 'external_link', url: 'javascript:alert(1)' },
        ],
      }],
    },
    { id: 't2', title: 'Tema sin clases', sessions: [] },
  ],
  sessions: [],
};
const AVISOS = [
  { materialId: 'f1', title: 'Guía', change: 'replaced', changedAt: '2026-11-21T12:00:00Z' },
  { materialId: 'f2', title: 'Mapa', change: 'deleted', changedAt: '2026-11-20T12:00:00Z' },
];

beforeEach(() => {
  Object.values(fake).forEach(fn => fn.mockReset());
  fake.listMaterialCourses.mockResolvedValue(CURSOS);
  fake.listModuleSessions.mockResolvedValue(CLASES);
  fake.listFileNotices.mockResolvedValue([]);
  fake.dismissFileNotice.mockResolvedValue();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

async function abrirClase(nombre) {
  const usuario = userEvent.setup();
  await usuario.click(await screen.findByRole('button', { name: new RegExp(`^${nombre}`) }));
  return usuario;
}

describe('Material del alumno', () => {
  test('con Supabase muestra el material real del área activa en solo lectura', async () => {
    render(<Modulos />);
    expect(await screen.findByText('Ecuaciones')).toBeInTheDocument();
    expect(fake.listModuleSessions).toHaveBeenCalledWith('m1');
    expect(screen.queryByText('Tema sin clases')).not.toBeInTheDocument();
    expect(screen.getByText('2 recursos')).toBeInTheDocument();
    await abrirClase('Ecuaciones');
    expect(screen.getByRole('link', { name: /Video de ecuaciones/ })).toHaveAttribute('href', 'https://drive.google.com/v');
    expect(screen.queryByText('Malicioso')).not.toBeInTheDocument();
    expect(screen.getByText('PDF · 2 KB')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Descargar/ })).not.toBeInTheDocument();
  });

  test('abre el archivo con una URL firmada y vuelve a revisar los avisos', async () => {
    const pestana = { location: { href: '' }, close: vi.fn(), opener: window };
    vi.spyOn(window, 'open').mockReturnValue(pestana);
    fake.openFile.mockResolvedValue('https://firmada/guia.pdf');
    render(<Modulos />);
    const usuario = await abrirClase('Ecuaciones');
    await usuario.click(screen.getByRole('button', { name: 'Ver Guía' }));
    await waitFor(() => expect(pestana.location.href).toBe('https://firmada/guia.pdf'));
    expect(fake.openFile).toHaveBeenCalledWith('f1');
    expect(pestana.opener).toBeNull();
    await waitFor(() => expect(fake.listFileNotices).toHaveBeenCalledTimes(2));
  });

  test('si el archivo ya no está disponible, lo explica', async () => {
    vi.spyOn(window, 'open').mockReturnValue({ location: { href: '' }, close: vi.fn() });
    fake.openFile.mockRejectedValue(new Error('Este archivo ya no está disponible.'));
    render(<Modulos />);
    const usuario = await abrirClase('Ecuaciones');
    await usuario.click(screen.getByRole('button', { name: 'Ver Guía' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Este archivo ya no está disponible.');
  });

  test('muestra los avisos de reemplazo y borrado y los cierra', async () => {
    fake.listFileNotices.mockResolvedValueOnce(AVISOS).mockResolvedValue([AVISOS[1]]);
    render(<Modulos />);
    const avisos = within(await screen.findByRole('region', { name: 'Avisos de material' }));
    expect(avisos.getByText(/«Guía» fue reemplazado el .*Ábrelo de nuevo/)).toBeInTheDocument();
    expect(avisos.getByText(/«Mapa» fue borrado el .*ya no está disponible/)).toBeInTheDocument();
    await userEvent.setup().click(avisos.getByRole('button', { name: 'Cerrar aviso de Guía' }));
    await waitFor(() => expect(fake.dismissFileNotice).toHaveBeenCalledWith('f1'));
    await waitFor(() => expect(screen.queryByText(/«Guía» fue reemplazado/)).not.toBeInTheDocument());
    expect(screen.getByText(/«Mapa» fue borrado/)).toBeInTheDocument();
  });

  test('si no se puede cerrar el aviso, lo dice', async () => {
    fake.listFileNotices.mockResolvedValue(AVISOS);
    fake.dismissFileNotice.mockRejectedValue(new Error('No se pudo guardar. Intenta de nuevo.'));
    render(<Modulos />);
    await userEvent.setup().click(await screen.findByRole('button', { name: 'Cerrar aviso de Mapa' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo guardar');
  });

  test('cambia de área', async () => {
    const usuario = userEvent.setup();
    render(<Modulos />);
    await screen.findByText('Ecuaciones');
    await usuario.click(screen.getByRole('tab', { name: /Premedicina/ }));
    await waitFor(() => expect(fake.listModuleSessions).toHaveBeenLastCalledWith('m2'));
  });

  test('avisa si el área no tiene clases o el alumno no tiene cursos', async () => {
    fake.listModuleSessions.mockResolvedValue({ topics: [], sessions: [] });
    const { unmount } = render(<Modulos />);
    expect(await screen.findByText(/aún no tiene clases publicadas/)).toBeInTheDocument();
    unmount();
    fake.listMaterialCourses.mockResolvedValue([]);
    render(<Modulos />);
    expect(await screen.findByText(/no estás inscrito en un curso activo/)).toBeInTheDocument();
  });

  test('muestra el error de carga y permite reintentar', async () => {
    fake.listMaterialCourses.mockRejectedValueOnce(new Error('No pudimos cargar el material. Intenta de nuevo.'));
    render(<Modulos />);
    expect(await screen.findByText('No pudimos cargar el material. Intenta de nuevo.')).toBeInTheDocument();
    await userEvent.setup().click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(await screen.findByText('Ecuaciones')).toBeInTheDocument();
  });
});
