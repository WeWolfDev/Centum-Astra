// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, test } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import ColeccionEstrellas from './ColeccionEstrellas';

afterEach(cleanup);

const registros = n => Array.from({ length: n }, (_, i) => ({ evaluacionId: `q${i}`, fecha: '2026-11-27' }));

describe('ColeccionEstrellas', () => {
  test('pone todas las estrellas en un renglón, sin días de la semana', () => {
    render(<ColeccionEstrellas registros={registros(3)} />);
    expect(screen.getByRole('heading', { name: 'Tus estrellas' })).toBeInTheDocument();
    expect(within(screen.getByRole('list', { name: '3 estrellas' })).getAllByRole('listitem')).toHaveLength(3);
    expect(screen.queryByText('L')).not.toBeInTheDocument();
  });

  test('con muchas, muestra las primeras y cuántas más hay', () => {
    render(<ColeccionEstrellas registros={registros(20)} />);
    expect(screen.getByText('+6')).toBeInTheDocument();
  });

  test('sin estrellas invita a ganar la primera', () => {
    render(<ColeccionEstrellas registros={[]} />);
    expect(screen.getByText('Termina un quiz para ganar tu primera estrella.')).toBeInTheDocument();
  });
});
