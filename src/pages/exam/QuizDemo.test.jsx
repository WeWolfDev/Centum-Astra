// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import QuizDemo from './QuizDemo';

afterEach(cleanup);

const quiz = {
  id: 'q1',
  tipo: 'quiz',
  titulo: 'Quiz de prueba',
  preguntas: [
    { id: 'p1', texto: '¿Uno?', opciones: [{ id: 'a', texto: 'Sí' }, { id: 'b', texto: 'No' }], correcta: 'a' },
    { id: 'p2', texto: '¿Dos?', opciones: [{ id: 'c', texto: 'Sí' }, { id: 'd', texto: 'No' }], correcta: 'c' },
  ],
};

async function contestar(respuestas) {
  for (const [i, texto] of respuestas.entries()) {
    await userEvent.click(screen.getByRole('radio', { name: texto }));
    const ultima = i === respuestas.length - 1;
    await userEvent.click(screen.getByRole('button', { name: ultima ? 'Terminar' : 'Siguiente' }));
  }
}

describe('QuizDemo', () => {
  test('al terminar muestra aciertos y porcentaje, y la estrella ganada', async () => {
    const onTerminar = vi.fn(() => ({ gano: true, total: 13 }));
    render(<QuizDemo evaluacion={quiz} onTerminar={onTerminar} onSalir={() => {}} />);

    await contestar(['Sí', 'No']);

    expect(onTerminar).toHaveBeenCalledWith('q1');
    expect(screen.getByText('1 de 2 aciertos · 50 %')).toBeInTheDocument();
    expect(screen.getByText('¡Ganaste una estrella!')).toBeInTheDocument();
    expect(screen.getByText('13')).toBeInTheDocument();
    expect(screen.queryByText(/puntaje estimado/i)).not.toBeInTheDocument();
  });

  test('si ya ganó la estrella de ese quiz hoy, lo dice', async () => {
    render(<QuizDemo evaluacion={quiz} onTerminar={() => ({ gano: false, total: 13 })} onSalir={() => {}} />);
    await contestar(['Sí', 'Sí']);
    expect(screen.getByText(/ya ganaste la estrella de este quiz hoy/i)).toBeInTheDocument();
  });

  test('no deja avanzar sin elegir una respuesta', () => {
    render(<QuizDemo evaluacion={quiz} onTerminar={() => ({ gano: true, total: 1 })} onSalir={() => {}} />);
    expect(screen.getByRole('button', { name: 'Siguiente' })).toBeDisabled();
  });

  test('el simulador también da puntaje estimado, con su aclaración', async () => {
    render(<QuizDemo evaluacion={{ ...quiz, tipo: 'simulador' }} onTerminar={() => ({ gano: true, total: 1 })} onSalir={() => {}} />);
    await contestar(['Sí', 'Sí']);
    expect(screen.getByText('2 de 2 aciertos · 100 % · 1,300 puntos')).toBeInTheDocument();
    expect(screen.getByText(/no es resultado oficial del EXANI-II/i)).toBeInTheDocument();
  });
});
