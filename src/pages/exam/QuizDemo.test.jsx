// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
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
    { id: 'p3', texto: '¿Tres?', opciones: [{ id: 'e', texto: 'Sí' }, { id: 'f', texto: 'No' }], correcta: 'e' },
  ],
};

function panel() {
  return within(screen.getByRole('navigation', { name: 'Preguntas' }));
}

function renderizar(props = {}) {
  return render(<QuizDemo evaluacion={quiz} onTerminar={() => ({ gano: true, total: 13 })} onSalir={() => {}} {...props} />);
}

describe('QuizDemo', () => {
  test('el panel lleva a cualquier pregunta y marca cuáles ya se contestaron', async () => {
    renderizar();
    await userEvent.click(screen.getByRole('radio', { name: 'Sí' }));

    expect(panel().getByRole('button', { name: 'Pregunta 1, contestada' })).toHaveAttribute('aria-current', 'step');
    await userEvent.click(panel().getByRole('button', { name: 'Pregunta 3, sin contestar' }));

    expect(screen.getByText('¿Tres?')).toBeInTheDocument();
    expect(panel().getByRole('button', { name: 'Pregunta 3, sin contestar' })).toHaveAttribute('aria-current', 'step');
  });

  test('se puede regresar a la pregunta anterior y la respuesta sigue marcada', async () => {
    renderizar();
    await userEvent.click(screen.getByRole('radio', { name: 'No' }));
    await userEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
    await userEvent.click(screen.getByRole('button', { name: 'Anterior' }));

    expect(screen.getByText('¿Uno?')).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'No' })).toBeChecked();
  });

  test('si faltan preguntas, avisa antes de terminar', async () => {
    const onTerminar = vi.fn(() => ({ gano: true, total: 1 }));
    renderizar({ onTerminar });
    await userEvent.click(screen.getByRole('button', { name: 'Terminar' }));

    expect(screen.getByText('Te faltan 3 preguntas sin contestar.')).toBeInTheDocument();
    expect(onTerminar).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: 'Terminar de todos modos' }));
    expect(onTerminar).toHaveBeenCalledWith('q1');
  });

  test('al terminar muestra el resultado, la estrella y cuáles salieron bien y mal', async () => {
    const onTerminar = vi.fn(() => ({ gano: true, total: 13 }));
    renderizar({ onTerminar });
    for (const respuesta of ['Sí', 'No', 'Sí']) {
      await userEvent.click(screen.getByRole('radio', { name: respuesta }));
      if (screen.queryByRole('button', { name: 'Siguiente' })) await userEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
    }
    await userEvent.click(screen.getByRole('button', { name: 'Terminar' }));

    expect(onTerminar).toHaveBeenCalledWith('q1');
    expect(screen.getByText('2 de 3 aciertos · 67 %')).toBeInTheDocument();
    expect(screen.getByText('¡Ganaste una estrella!')).toBeInTheDocument();
    expect(panel().getByRole('button', { name: 'Pregunta 1, correcta' })).toBeInTheDocument();
    await userEvent.click(panel().getByRole('button', { name: 'Pregunta 2, incorrecta' }));
    expect(screen.getByText('Correcta: Sí')).toBeInTheDocument();
  });

  test('el simulador también da puntaje estimado, con su aclaración', async () => {
    renderizar({ evaluacion: { ...quiz, tipo: 'simulador' } });
    for (let i = 0; i < 3; i += 1) {
      await userEvent.click(screen.getByRole('radio', { name: 'Sí' }));
      if (i < 2) await userEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
    }
    await userEvent.click(screen.getByRole('button', { name: 'Terminar' }));
    expect(screen.getByText('3 de 3 aciertos · 100 % · 1,300 puntos')).toBeInTheDocument();
    expect(screen.getByText(/no es resultado oficial del EXANI-II/i)).toBeInTheDocument();
  });

  test('si ya ganó la estrella de ese quiz hoy, lo dice', async () => {
    renderizar({ onTerminar: () => ({ gano: false, total: 13 }) });
    await userEvent.click(screen.getByRole('button', { name: 'Terminar' }));
    await userEvent.click(screen.getByRole('button', { name: 'Terminar de todos modos' }));
    expect(screen.getByText(/ya ganaste la estrella de este quiz hoy/i)).toBeInTheDocument();
  });
});
