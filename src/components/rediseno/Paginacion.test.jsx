// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Paginacion from './Paginacion';

afterEach(cleanup);

describe('Paginacion', () => {
  test('no se muestra si todo cabe en una página', () => {
    render(<Paginacion page={0} pageSize={25} total={25} onCambiar={() => {}} />);
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });

  test('en la primera página no permite retroceder', () => {
    render(<Paginacion page={0} pageSize={25} total={60} onCambiar={() => {}} />);
    expect(screen.getByRole('button', { name: 'Anterior' })).toBeDisabled();
    expect(screen.getByText('Mostrando 1–25 de 60')).toBeInTheDocument();
  });

  test('en la última página no permite avanzar y recorta el rango', () => {
    render(<Paginacion page={2} pageSize={25} total={60} onCambiar={() => {}} />);
    expect(screen.getByRole('button', { name: 'Siguiente' })).toBeDisabled();
    expect(screen.getByText('Mostrando 51–60 de 60')).toBeInTheDocument();
  });

  test('avisa la página elegida', async () => {
    const onCambiar = vi.fn();
    render(<Paginacion page={1} pageSize={25} total={80} onCambiar={onCambiar} />);
    await userEvent.click(screen.getByRole('button', { name: 'Anterior' }));
    expect(onCambiar).toHaveBeenCalledWith(0);
  });
});
