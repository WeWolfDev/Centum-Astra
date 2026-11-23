// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import TeacherDashboard from './TeacherDashboard';

vi.mock('../../context/AuthContext', () => ({ useAuth: () => ({ user: { name: 'Profesor demo', role: 'teacher' } }) }));

afterEach(cleanup);

// Sin Supabase configurado el panel es el demo con mockData (#37).
describe('TeacherDashboard en modo demo', () => {
  test('avisa que los alumnos y sus promedios son de ejemplo', () => {
    render(<TeacherDashboard />);
    expect(screen.getByRole('note')).toHaveTextContent('Datos de ejemplo.');
  });
});
