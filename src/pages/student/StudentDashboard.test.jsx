// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const fake = vi.hoisted(() => ({ listMaterialCourses: vi.fn() }));

vi.mock('../../lib/supabaseClient', () => ({ isSupabaseConfigured: true, supabase: null }));
vi.mock('../../context/AuthContext', () => ({ useAuth: () => ({ user: { id: 'al1', role: 'student', name: 'Ana López' } }) }));
vi.mock('../../lib/materialService', async () => {
  const real = await vi.importActual('../../lib/materialService');
  return { ...real, ...fake };
});

const { default: StudentDashboard } = await import('./StudentDashboard');

beforeEach(() => {
  fake.listMaterialCourses.mockReset();
  fake.listMaterialCourses.mockResolvedValue([
    { id: 'c1', name: 'Curso 2027', modules: [{ id: 'm1', title: 'Pensamiento matemático' }, { id: 'm2', title: 'Comprensión lectora' }] },
  ]);
});

afterEach(cleanup);

describe('Tu material en Inicio', () => {
  test('con Supabase, las tarjetas son las áreas reales y abren la elegida', async () => {
    const setActiveSection = vi.fn();
    render(<StudentDashboard setActiveSection={setActiveSection} />);
    await userEvent.setup().click(await screen.findByRole('button', { name: 'Abrir módulo Comprensión lectora' }));
    expect(setActiveSection).toHaveBeenCalledWith('modules', 'm2');
    expect(screen.queryByRole('button', { name: /Abrir módulo Premedicina/ })).not.toBeInTheDocument();
  });

  test('si no se pueden cargar las áreas, lo dice y permite reintentar', async () => {
    fake.listMaterialCourses.mockRejectedValueOnce(new Error('No pudimos cargar el material. Intenta de nuevo.'));
    render(<StudentDashboard setActiveSection={vi.fn()} />);
    expect(await screen.findByText('No pudimos cargar el material. Intenta de nuevo.')).toBeInTheDocument();
    await userEvent.setup().click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(await screen.findByRole('button', { name: 'Abrir módulo Pensamiento matemático' })).toBeInTheDocument();
  });
});
