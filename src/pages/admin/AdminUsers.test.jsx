// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const fake = vi.hoisted(() => ({
  listUsers: vi.fn(),
  listGroups: vi.fn(),
  runAdminAction: vi.fn(),
  setUserGroups: vi.fn(),
}));

vi.mock('../../lib/usersService', async () => {
  const real = await vi.importActual('../../lib/usersService');
  return { ...real, ...fake };
});
vi.mock('../../lib/supabaseClient', () => ({ supabase: {} }));
vi.mock('../../context/AuthContext', () => ({ useAuth: () => ({ user: { id: 'yo' } }) }));

const { default: AdminUsers, AdminOverview } = await import('./AdminUsers');

const ALUMNA = { id: 'a1', name: 'Ana García', email: 'ana@x.mx', role: 'student', status: 'active', createdAt: '2', groups: [] };
const YO = { id: 'yo', name: 'Admin', email: 'yo@x.mx', role: 'admin', status: 'active', createdAt: '1', groups: [] };
const PROFE = { id: 't1', name: 'Luis Pérez', email: 'luis@x.mx', role: 'teacher', status: 'suspended', createdAt: '3', groups: [{ id: 'g1', name: 'Grupo A' }] };

beforeEach(() => {
  Object.values(fake).forEach(fn => fn.mockReset());
  fake.listUsers.mockResolvedValue([ALUMNA, YO, PROFE]);
  fake.listGroups.mockResolvedValue([{ id: 'g1', name: 'Grupo A', code: 'A', course: 'Curso' }]);
  fake.runAdminAction.mockResolvedValue({});
  fake.setUserGroups.mockResolvedValue();
});

afterEach(cleanup);

function filaDe(nombre) {
  return screen.getByText(nombre).closest('li');
}

describe('AdminUsers', () => {
  test('lista las cuentas y no muestra datos de pagos', async () => {
    render(<AdminUsers />);
    expect(screen.getByRole('status')).toHaveTextContent('Cargando');
    expect(await screen.findByText('Ana García')).toBeInTheDocument();
    expect(screen.queryByText('Aprobar')).not.toBeInTheDocument();
    expect(screen.queryByText(/pago/i)).not.toBeInTheDocument();
  });

  test('muestra el error y permite reintentar', async () => {
    fake.listUsers.mockRejectedValueOnce(new Error('No pudimos cargar la información.'));
    render(<AdminUsers />);
    expect(await screen.findByText('No pudimos cargar la información.')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(await screen.findByText('Ana García')).toBeInTheDocument();
  });

  test('filtra por búsqueda y muestra el estado vacío', async () => {
    render(<AdminUsers />);
    await screen.findByText('Ana García');
    await userEvent.type(screen.getByRole('searchbox'), 'zzz');
    expect(screen.getByText('Sin resultados')).toBeInTheDocument();
  });

  test('no ofrece suspender ni eliminar la cuenta propia', async () => {
    render(<AdminUsers />);
    await screen.findByText('Admin');
    const fila = within(filaDe('Admin'));
    expect(fila.queryByRole('button', { name: 'Suspender' })).not.toBeInTheDocument();
    expect(fila.queryByRole('button', { name: 'Eliminar' })).not.toBeInTheDocument();
    expect(fila.queryByRole('button', { name: 'Grupos' })).not.toBeInTheDocument();
  });

  test('suspende con motivo, confirma y recarga desde el servidor', async () => {
    render(<AdminUsers />);
    await screen.findByText('Ana García');
    await userEvent.click(within(filaDe('Ana García')).getByRole('button', { name: 'Suspender' }));
    const dialogo = within(await screen.findByRole('dialog'));
    await userEvent.type(dialogo.getByLabelText('Motivo'), 'Adeudo');
    await userEvent.click(dialogo.getByRole('button', { name: 'Suspender' }));
    await waitFor(() => expect(fake.runAdminAction).toHaveBeenCalledWith('suspend', { userId: 'a1', reason: 'Adeudo' }));
    expect(await screen.findByText('Cuenta suspendida.')).toBeInTheDocument();
    await waitFor(() => expect(fake.listUsers).toHaveBeenCalledTimes(2));
  });

  test('deja el diálogo abierto con el error y sin confirmar', async () => {
    fake.runAdminAction.mockRejectedValue(new Error('Ya existe una cuenta con ese correo.'));
    render(<AdminUsers />);
    await screen.findByText('Ana García');
    await userEvent.click(screen.getByRole('button', { name: /Nueva cuenta/ }));
    const dialogo = within(await screen.findByRole('dialog'));
    await userEvent.type(dialogo.getByLabelText('Nombre completo'), 'Eva');
    await userEvent.type(dialogo.getByLabelText('Correo electrónico'), 'eva@x.mx');
    await userEvent.click(dialogo.getByRole('button', { name: 'Enviar invitación' }));
    expect(await dialogo.findByRole('alert')).toHaveTextContent('Ya existe');
    expect(screen.queryByText('Invitación enviada.')).not.toBeInTheDocument();
    expect(fake.runAdminAction).toHaveBeenCalledWith('invite', { email: 'eva@x.mx', fullName: 'Eva', role: 'student' });
  });

  test('asigna un grupo al alumno', async () => {
    render(<AdminUsers />);
    await screen.findByText('Ana García');
    await userEvent.click(within(filaDe('Ana García')).getByRole('button', { name: 'Grupos' }));
    const dialogo = within(await screen.findByRole('dialog'));
    await userEvent.selectOptions(dialogo.getByLabelText('Grupo'), 'g1');
    await userEvent.click(dialogo.getByRole('button', { name: 'Guardar' }));
    await waitFor(() => expect(fake.setUserGroups).toHaveBeenCalledWith(ALUMNA, ['g1']));
  });

  test('reactiva sin pedir motivo', async () => {
    render(<AdminUsers />);
    await screen.findByText('Luis Pérez');
    await userEvent.click(within(filaDe('Luis Pérez')).getByRole('button', { name: 'Reactivar' }));
    const dialogo = within(await screen.findByRole('dialog'));
    expect(dialogo.queryByLabelText('Motivo')).not.toBeInTheDocument();
    await userEvent.click(dialogo.getByRole('button', { name: 'Reactivar' }));
    await waitFor(() => expect(fake.runAdminAction).toHaveBeenCalledWith('reactivate', { userId: 't1' }));
  });
});

describe('AdminOverview', () => {
  test('calcula las cifras con cuentas reales', async () => {
    render(<AdminOverview />);
    expect(await screen.findByText('Total alumnos')).toBeInTheDocument();
    expect(screen.getByText('Profesores activos')).toBeInTheDocument();
    expect(screen.getByText('Cuentas recientes')).toBeInTheDocument();
    expect(screen.queryByText('Calificación media')).not.toBeInTheDocument();
  });
});
