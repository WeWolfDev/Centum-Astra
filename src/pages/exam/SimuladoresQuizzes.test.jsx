// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { quizzesEjemplo } from '../../data/quizzesEjemplo';

vi.mock('../../lib/supabaseClient', () => ({ isSupabaseConfigured: false, supabase: null }));
vi.mock('../../context/AuthContext', () => ({ useAuth: () => ({ user: { email: 'ana@centum.mx', role: 'student' } }) }));
vi.mock('../../context/MaterialContext', () => ({ useMaterial: () => ({ simuladores: [], quizzes: [] }) }));

const { default: SimuladoresQuizzes } = await import('./SimuladoresQuizzes');

beforeEach(() => window.localStorage.clear());
afterEach(cleanup);

function totalEstrellas() {
  const coleccion = screen.getByRole('region', { name: 'Tus estrellas' });
  return Number(within(coleccion).getAllByText(/^\d+$/)[0].textContent);
}

async function contestarTodo(quiz) {
  for (const [i, p] of quiz.preguntas.entries()) {
    const correcta = p.opciones.find(o => o.id === p.correcta);
    await userEvent.click(screen.getByRole('radio', { name: correcta.texto }));
    await userEvent.click(screen.getByRole('button', { name: i === quiz.preguntas.length - 1 ? 'Terminar' : 'Siguiente' }));
  }
}

describe('Simuladores y quizzes en modo demo', () => {
  test('contestar un quiz de práctica da una estrella que se suma a la colección', async () => {
    render(<SimuladoresQuizzes />);
    const antes = totalEstrellas();
    const quiz = quizzesEjemplo[0];

    await userEvent.click(screen.getByRole('button', { name: new RegExp(quiz.titulo) }));
    await contestarTodo(quiz);

    expect(screen.getByText('¡Ganaste una estrella!')).toBeInTheDocument();
    expect(screen.getByText(`${quiz.preguntas.length} de ${quiz.preguntas.length} aciertos · 100 %`)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Volver a Simuladores y quizzes' }));
    expect(totalEstrellas()).toBe(antes + 1);
  });

  test('el simulador de muestra se puede contestar y da puntaje estimado', async () => {
    render(<SimuladoresQuizzes />);
    await userEvent.click(screen.getByRole('button', { name: 'Probar simulador de muestra' }));
    expect(screen.getByRole('heading', { name: 'Simulador de muestra' })).toBeInTheDocument();
    expect(screen.getByText('Pregunta 1 de 8')).toBeInTheDocument();
  });
});
