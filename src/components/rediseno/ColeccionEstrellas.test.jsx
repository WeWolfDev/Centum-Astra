// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, test } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import ColeccionEstrellas from './ColeccionEstrellas';

afterEach(cleanup);

const hoy = new Date(2026, 10, 27);

describe('ColeccionEstrellas', () => {
  test('muestra cuántas lleva, su racha y la semana', () => {
    const registros = [
      { evaluacionId: 'a', fecha: '2026-11-26' },
      { evaluacionId: 'b', fecha: '2026-11-27' },
      { evaluacionId: 'c', fecha: '2026-11-27' },
    ];
    render(<ColeccionEstrellas registros={registros} hoy={hoy} />);

    expect(screen.getByRole('heading', { name: 'Tus estrellas' })).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText(/racha de/i)).toHaveTextContent('Racha de 2 días');
    const dias = within(screen.getByRole('list', { name: 'Esta semana' })).getAllByRole('listitem');
    expect(dias).toHaveLength(7);
    expect(dias[4]).toHaveAccessibleName('2026-11-27: 2 estrellas, hoy');
  });

  test('sin estrellas invita a empezar la racha', () => {
    render(<ColeccionEstrellas registros={[]} hoy={hoy} />);
    expect(screen.getByText('Termina un quiz hoy para empezar tu racha.')).toBeInTheDocument();
  });
});
