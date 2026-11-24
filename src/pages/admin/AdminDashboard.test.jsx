// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, test } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import AdminDashboard from './AdminDashboard';

afterEach(cleanup);

// Sin Supabase configurado el panel es el demo con mockData (#37).
describe('AdminDashboard en modo demo', () => {
  test('el resumen avisa que las cifras son de ejemplo', () => {
    render(<AdminDashboard view="overview" />);
    expect(screen.getByRole('note')).toHaveTextContent('Datos de ejemplo.');
  });

  test('el listado de alumnos avisa que los alumnos son de ejemplo', () => {
    render(<AdminDashboard view="students" />);
    expect(screen.getByRole('note')).toHaveTextContent('Datos de ejemplo.');
  });
});
