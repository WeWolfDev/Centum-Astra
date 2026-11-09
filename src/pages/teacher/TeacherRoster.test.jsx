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
    listMyStudents.mockResolvedValue([ANA]);
    render(<TeacherRoster />);
    expect(await screen.findByText('Ana')).toBeInTheDocument();
    expect(screen.getByText('Grupo A')).toBeInTheDocument();
  });

  test('distingue sin alumnos de sin resultados', async () => {
    listMyStudents.mockResolvedValue([]);
    render(<TeacherRoster />);
    expect(await screen.findByText('Sin alumnos')).toBeInTheDocument();
  });

  test('filtra por búsqueda', async () => {
    listMyStudents.mockResolvedValue([ANA]);
    render(<TeacherRoster />);
    await screen.findByText('Ana');
    await userEvent.type(screen.getByRole('searchbox'), 'zzz');
    expect(screen.getByText('Sin resultados')).toBeInTheDocument();
  });

  test('permite reintentar tras un error', async () => {
    listMyStudents.mockRejectedValueOnce(new Error('Falló')).mockResolvedValue([ANA]);
    render(<TeacherRoster />);
    expect(await screen.findByText('Falló')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(await screen.findByText('Ana')).toBeInTheDocument();
  });
});
