// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const listMyStudents = vi.hoisted(() => vi.fn());

vi.mock('../../lib/usersService', async () => {
  const real = await vi.importActual('../../lib/usersService');
  return { ...real, listMyStudents };
});
vi.mock('../../lib/supabaseClient', () => ({ supabase: {} }));

const { default: TeacherRoster } = await import('./TeacherRoster');

const ANA = { id: 'a', name: 'Ana', email: 'ana@x.mx', status: 'active', groups: [{ id: 'g1', name: 'Grupo A' }] };

beforeEach(() => listMyStudents.mockReset());
afterEach(cleanup);

describe('TeacherRoster', () => {
  test('muestra a los alumnos con su grupo', async () => {
    listMyStudents.mockResolvedValue({ users: [ANA], total: 1 });
    render(<TeacherRoster />);
    expect(await screen.findByText('Ana')).toBeInTheDocument();
    expect(screen.getByText('Grupo A')).toBeInTheDocument();
  });

  test('distingue sin alumnos de sin resultados', async () => {
    listMyStudents.mockResolvedValue({ users: [], total: 0 });
    render(<TeacherRoster />);
    expect(await screen.findByText('Sin alumnos')).toBeInTheDocument();
  });

  test('busca en el servidor y distingue sin resultados', async () => {
    listMyStudents.mockResolvedValueOnce({ users: [ANA], total: 1 }).mockResolvedValue({ users: [], total: 0 });
    render(<TeacherRoster />);
    await screen.findByText('Ana');
    await userEvent.type(screen.getByRole('searchbox'), 'zzz');
    expect(await screen.findByText('Sin resultados')).toBeInTheDocument();
    expect(listMyStudents).toHaveBeenLastCalledWith({ search: 'zzz', page: 0 });
  });

  test('pasa a la página siguiente con el total del servidor', async () => {
    listMyStudents.mockResolvedValue({ users: [ANA], total: 60 });
    render(<TeacherRoster />);
    await screen.findByText('Ana');
    expect(screen.getByText('Mostrando 1–25 de 60')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
    await screen.findByText('Mostrando 26–50 de 60');
    expect(listMyStudents).toHaveBeenLastCalledWith({ search: '', page: 1 });
  });

  test('permite reintentar tras un error', async () => {
    listMyStudents.mockRejectedValueOnce(new Error('Falló')).mockResolvedValue({ users: [ANA], total: 1 });
    render(<TeacherRoster />);
    expect(await screen.findByText('Falló')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(await screen.findByText('Ana')).toBeInTheDocument();
  });
});
