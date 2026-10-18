// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, test } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Aviso, AvisoProvider, useAviso } from './Aviso';

afterEach(cleanup);

function Disparador({ opciones }) {
  const { mostrar } = useAviso();
  return (
    <button type="button" onClick={() => mostrar(opciones)}>
      disparar
    </button>
  );
}

describe('Aviso (toast)', () => {
  test('role="status" + aria-live="polite" en tipos no urgentes', () => {
    render(<Aviso tipo="exito" titulo="Guardado" mensaje="OK" />);
    const toast = screen.getByRole('status');
    expect(toast).toHaveAttribute('aria-live', 'polite');
  });

  test('role="alert" en tipos urgentes (error, advertencia)', () => {
    const { rerender } = render(<Aviso tipo="error" titulo="Error" mensaje="Falló" />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.queryByRole('status')).toBeNull();

    rerender(<Aviso tipo="advertencia" titulo="Cuidado" />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  test('se cierra automáticamente después de duracion', async () => {
    // Usamos tiempos reales cortos (50 ms) para evitar los conflictos conocidos
    // entre userEvent y fake timers.
    const user = userEvent.setup();
    render(
      <AvisoProvider>
        <Disparador opciones={{ tipo: 'info', titulo: 'Hola', duracion: 50 }} />
      </AvisoProvider>,
    );

    await user.click(screen.getByRole('button', { name: /disparar/i }));
    expect(screen.getByText('Hola')).toBeInTheDocument();

    await waitFor(() => expect(screen.queryByText('Hola')).toBeNull(), {
      timeout: 1000,
    });
  });

  test('el botón "Cerrar aviso" lo quita del DOM', async () => {
    const user = userEvent.setup();
    render(
      <AvisoProvider>
        <Disparador opciones={{ tipo: 'info', titulo: 'Hola', duracion: 0 }} />
      </AvisoProvider>,
    );

    await user.click(screen.getByRole('button', { name: /disparar/i }));
    expect(screen.getByText('Hola')).toBeInTheDocument();

    const cerrar = screen.getByRole('button', { name: /cerrar aviso/i });
    await user.click(cerrar);
    expect(screen.queryByText('Hola')).toBeNull();
  });
});

