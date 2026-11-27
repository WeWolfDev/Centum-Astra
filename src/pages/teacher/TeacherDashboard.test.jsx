// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
const rediseno = vi.hoisted(() => ({ atencionPorBaja: true }));

vi.mock('../../context/AuthContext', () => ({ useAuth: () => ({ user: { name: 'Profesor demo', role: 'teacher' } }) }));
vi.mock('../../config/rediseno', async () => ({
  ...(await vi.importActual('../../config/rediseno')),
  get ATENCION_POR_BAJA() { return rediseno.atencionPorBaja; },
}));

const { default: TeacherDashboard } = await import('./TeacherDashboard');

afterEach(() => {
  cleanup();
  rediseno.atencionPorBaja = true;
});

// Sin Supabase configurado el panel es el demo con mockData (#37).
describe('TeacherDashboard en modo demo', () => {
  test('avisa que los alumnos y sus promedios son de ejemplo', () => {
    render(<TeacherDashboard />);
    expect(screen.getByRole('note')).toHaveTextContent('Datos de ejemplo.');
  });

  test('si nadie requiere atención, lo dice sin la alerta roja', () => {
    rediseno.atencionPorBaja = false;
    render(<TeacherDashboard />);
    expect(screen.getByText('Nadie requiere atención')).toBeInTheDocument();
    expect(screen.queryByText('bajan o llevan semanas sin entrar')).not.toBeInTheDocument();
  });
});
