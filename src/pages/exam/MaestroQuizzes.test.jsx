// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, test } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MaterialProvider } from '../../context/MaterialContext';
import MaestroQuizzes from './MaestroQuizzes';

afterEach(cleanup);

function renderizar(ui) {
  return render(<MaterialProvider>{ui}</MaterialProvider>);
}

describe('MaestroQuizzes', () => {
  test('el profesor solo ve quizzes y no puede crear simuladores', () => {
    renderizar(<MaestroQuizzes />);
    expect(screen.getByRole('heading', { level: 1, name: 'Quizzes' })).toBeInTheDocument();
    expect(screen.queryByRole('tab')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /simulador/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Crear mi primer quiz' })).toBeInTheDocument();
  });

  test('el administrador ve las pestañas de simuladores y quizzes', () => {
    renderizar(<MaestroQuizzes conSimuladores />);
    expect(screen.getByRole('heading', { level: 1, name: 'Simuladores y quizzes' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Simuladores' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Quizzes' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Crear mi primer simulador' })).toBeInTheDocument();
  });

  test('avisa que lo creado es de ejemplo mientras no se conecten las evaluaciones', () => {
    renderizar(<MaestroQuizzes />);
    expect(screen.getByRole('note')).toHaveTextContent('Datos de ejemplo.');
  });
});
