// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const fake = vi.hoisted(() => ({
  listCatalog: vi.fn(),
  createCourse: vi.fn(),
  updateCourse: vi.fn(),
  createGroup: vi.fn(),
  updateGroup: vi.fn(),
  createModule: vi.fn(),
  updateModule: vi.fn(),
  setStatus: vi.fn(),
}));
const config = vi.hoisted(() => ({ supabase: true }));

vi.mock('../../lib/catalogoService', async () => {
  const real = await vi.importActual('../../lib/catalogoService');
  return { ...real, ...fake };
});
vi.mock('../../lib/supabaseClient', () => ({
  supabase: {},
  get isSupabaseConfigured() { return config.supabase; },
}));

const { default: AdminCursos } = await import('./AdminCursos');

const CURSO = {
  id: 'c1', name: 'EXANI-II 2027', description: 'Generación de enero', status: 'active',
  startsOn: '2027-01-11', endsOn: '2027-06-26',
  groups: [{ id: 'g1', name: 'Grupo A', code: 'A', schedule: 'Sabatino: sábados, 8:00 a. m. a 12:00 p. m.', status: 'active' }],
  modules: [
    { id: 'm1', title: 'Pensamiento Matemático', description: '', position: 0, status: 'active' },
    { id: 'm2', title: 'Comprensión Lectora', description: '', position: 1, status: 'active' },
  ],
};

beforeEach(() => {
  config.supabase = true;
  Object.values(fake).forEach(fn => fn.mockReset());
  fake.listCatalog.mockResolvedValue([CURSO]);
  ['createCourse', 'updateCourse', 'createGroup', 'updateGroup', 'createModule', 'updateModule', 'setStatus']
    .forEach(nombre => fake[nombre].mockResolvedValue());
});
afterEach(cleanup);

const tarjetaDe = nombre => screen.getByRole('heading', { name: nombre }).closest('section');

describe('AdminCursos', () => {
  test('muestra cursos con fechas, grupos con horario y módulos en orden', async () => {
    render(<AdminCursos />);
    expect(screen.getByRole('status')).toHaveTextContent('Cargando');
    const curso = within(await waitFor(() => tarjetaDe('EXANI-II 2027')));
    expect(curso.getByText('11 ene 2027 – 26 jun 2027')).toBeInTheDocument();
    expect(curso.getByText('Sabatino: sábados, 8:00 a. m. a 12:00 p. m.')).toBeInTheDocument();
    const modulos = curso.getAllByRole('listitem').map(li => li.textContent).filter(t => t.includes('Pensamiento') || t.includes('Comprensión'));
    expect(modulos[0]).toContain('Pensamiento Matemático');
    expect(modulos[1]).toContain('Comprensión Lectora');
  });

  test('muestra el error y permite reintentar', async () => {
    fake.listCatalog.mockRejectedValueOnce(new Error('No pudimos cargar los cursos. Intenta de nuevo.'));
    render(<AdminCursos />);
    expect(await screen.findByText('No pudimos cargar los cursos. Intenta de nuevo.')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(await screen.findByRole('heading', { name: 'EXANI-II 2027' })).toBeInTheDocument();
  });

  test('sin cursos invita a crear el primero', async () => {
    fake.listCatalog.mockResolvedValue([]);
    render(<AdminCursos />);
    expect(await screen.findByText('Aún no hay cursos')).toBeInTheDocument();
  });

  test('crea un curso con fechas, avisa y recarga', async () => {
    render(<AdminCursos />);
    await screen.findByRole('heading', { name: 'EXANI-II 2027' });
    await userEvent.click(screen.getByRole('button', { name: 'Nuevo curso' }));
    const dialogo = within(screen.getByRole('dialog'));
    await userEvent.type(dialogo.getByLabelText('Nombre del curso'), 'EXANI-II 2028');
    await userEvent.type(dialogo.getByLabelText('Inicio'), '2028-01-10');
    await userEvent.type(dialogo.getByLabelText('Fin'), '2028-06-30');
    await userEvent.click(dialogo.getByRole('button', { name: 'Crear curso' }));

    expect(fake.createCourse).toHaveBeenCalledWith({
      name: 'EXANI-II 2028', description: '', startsOn: '2028-01-10', endsOn: '2028-06-30',
    });
    expect(await screen.findByText('Curso creado.')).toBeInTheDocument();
    expect(fake.listCatalog).toHaveBeenCalledTimes(2);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  test('si el servidor rechaza, el diálogo queda abierto con el error', async () => {
    fake.updateCourse.mockRejectedValueOnce(new Error('La fecha de fin no puede ser anterior a la de inicio.'));
    render(<AdminCursos />);
    const curso = within(await waitFor(() => tarjetaDe('EXANI-II 2027')));
    await userEvent.click(curso.getByRole('button', { name: 'Editar curso EXANI-II 2027' }));
    const dialogo = within(screen.getByRole('dialog'));
    expect(dialogo.getByLabelText('Nombre del curso')).toHaveValue('EXANI-II 2027');
    await userEvent.click(dialogo.getByRole('button', { name: 'Guardar' }));

    expect(await dialogo.findByRole('alert')).toHaveTextContent('La fecha de fin no puede ser anterior');
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  test('crea un grupo eligiendo un horario sugerido', async () => {
    render(<AdminCursos />);
    const curso = within(await waitFor(() => tarjetaDe('EXANI-II 2027')));
    await userEvent.click(curso.getByRole('button', { name: 'Agregar grupo a EXANI-II 2027' }));
    const dialogo = within(screen.getByRole('dialog'));
    await userEvent.type(dialogo.getByLabelText('Nombre del grupo'), 'Grupo B');
    await userEvent.type(dialogo.getByLabelText('Código'), 'B');
    await userEvent.click(dialogo.getByRole('button', { name: /Entre semana/ }));
    expect(dialogo.getByLabelText('Horario')).toHaveValue('Entre semana: martes y jueves, 7:00 a 9:00 p. m.');
    await userEvent.click(dialogo.getByRole('button', { name: 'Crear grupo' }));

    expect(fake.createGroup).toHaveBeenCalledWith({
      courseId: 'c1', name: 'Grupo B', code: 'B', schedule: 'Entre semana: martes y jueves, 7:00 a 9:00 p. m.',
    });
  });

  test('edita el horario de un grupo con texto libre', async () => {
    render(<AdminCursos />);
    const curso = within(await waitFor(() => tarjetaDe('EXANI-II 2027')));
    await userEvent.click(curso.getByRole('button', { name: 'Editar grupo Grupo A' }));
    const horario = within(screen.getByRole('dialog')).getByLabelText('Horario');
    await userEvent.clear(horario);
    await userEvent.type(horario, 'Domingos, 9:00 a 13:00');
    await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Guardar' }));

    expect(fake.updateGroup).toHaveBeenCalledWith('g1', { name: 'Grupo A', code: 'A', schedule: 'Domingos, 9:00 a 13:00' });
  });

  test('agrega un módulo al curso', async () => {
    render(<AdminCursos />);
    const curso = within(await waitFor(() => tarjetaDe('EXANI-II 2027')));
    await userEvent.click(curso.getByRole('button', { name: 'Agregar módulo a EXANI-II 2027' }));
    const dialogo = within(screen.getByRole('dialog'));
    await userEvent.type(dialogo.getByLabelText('Título del módulo'), 'Química');
    await userEvent.click(dialogo.getByRole('button', { name: 'Crear módulo' }));

    expect(fake.createModule).toHaveBeenCalledWith({ courseId: 'c1', title: 'Química', description: '' });
    expect(await screen.findByText('Módulo creado.')).toBeInTheDocument();
  });

  test('archiva un curso después de confirmar', async () => {
    render(<AdminCursos />);
    const curso = within(await waitFor(() => tarjetaDe('EXANI-II 2027')));
    await userEvent.click(curso.getByRole('button', { name: 'Archivar curso EXANI-II 2027' }));
    const dialogo = within(screen.getByRole('dialog'));
    expect(dialogo.getByText(/dejará de aparecer/)).toBeInTheDocument();
    expect(fake.setStatus).not.toHaveBeenCalled();
    await userEvent.click(dialogo.getByRole('button', { name: 'Archivar' }));

    expect(fake.setStatus).toHaveBeenCalledWith('courses', 'c1', 'archived');
    expect(await screen.findByText('Curso archivado.')).toBeInTheDocument();
  });

  test('muestra los archivados y reactiva uno sin pedir confirmación', async () => {
    const archivado = { id: 'm9', title: 'Módulo viejo', description: '', position: 2, status: 'archived' };
    fake.listCatalog.mockImplementation(async ({ includeArchived } = {}) =>
      (includeArchived ? [{ ...CURSO, modules: [...CURSO.modules, archivado] }] : [CURSO]));
    render(<AdminCursos />);
    await screen.findByRole('heading', { name: 'EXANI-II 2027' });
    expect(screen.queryByText('Módulo viejo')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Mostrar archivados' }));
    expect(await screen.findByText('Módulo viejo')).toBeInTheDocument();
    expect(fake.listCatalog).toHaveBeenLastCalledWith({ includeArchived: true });

    await userEvent.click(screen.getByRole('button', { name: 'Reactivar módulo Módulo viejo' }));
    expect(fake.setStatus).toHaveBeenCalledWith('modules', 'm9', 'active');
  });

  test('sin Supabase explica que la sección necesita la conexión', async () => {
    config.supabase = false;
    render(<AdminCursos />);
    expect(screen.getByText(/necesita la conexión con Supabase/)).toBeInTheDocument();
    expect(fake.listCatalog).not.toHaveBeenCalled();
  });
});
