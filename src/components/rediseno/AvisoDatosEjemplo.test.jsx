// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { afterEach, describe, it, expect } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import AvisoDatosEjemplo from './AvisoDatosEjemplo';

afterEach(cleanup);

describe('AvisoDatosEjemplo', () => {
  it('anuncia que los datos son de ejemplo con un texto por defecto', () => {
    render(<AvisoDatosEjemplo />);
    const nota = screen.getByRole('note');
    expect(nota).toHaveTextContent('Datos de ejemplo.');
    expect(nota).toHaveTextContent('no es información real');
  });

  it('acepta un texto propio', () => {
    render(<AvisoDatosEjemplo>El historial se calculará con tus simuladores.</AvisoDatosEjemplo>);
    expect(screen.getByRole('note')).toHaveTextContent('Datos de ejemplo. El historial se calculará con tus simuladores.');
  });
});
