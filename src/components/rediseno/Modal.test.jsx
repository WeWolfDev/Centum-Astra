// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { useState } from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Modal from './Modal';

afterEach(cleanup);

function Host() {
  const [abierto, setAbierto] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setAbierto(true)}>
        Abrir
      </button>
      <Modal abierto={abierto} onCerrar={() => setAbierto(false)} titulo="Prueba">
        <p>Contenido</p>
      </Modal>
    </>
  );
}

describe('Modal', () => {
  test('devuelve el foco al disparador al cerrar', async () => {
    render(<Host />);

    const abrir = screen.getByRole('button', { name: /abrir/i });
    abrir.focus();
    expect(abrir).toHaveFocus();

    await userEvent.click(abrir);
    // Esperar a que el modal se monte y haga foco interno.
    const cerrar = await screen.findByRole('button', { name: /cerrar/i });
    await vi.waitFor(() => expect(cerrar).toHaveFocus());

    await userEvent.click(cerrar);
    // Al cerrarse, el foco debe volver al botón que lo abrió.
    await vi.waitFor(() => expect(abrir).toHaveFocus());
  });
});
