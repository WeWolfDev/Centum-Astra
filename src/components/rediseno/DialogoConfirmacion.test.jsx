// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DialogoConfirmacion from './DialogoConfirmacion';

afterEach(cleanup);

describe('DialogoConfirmacion', () => {
  test('el foco inicial va al botón Cancelar al abrir', async () => {
    render(
      <DialogoConfirmacion
        abierto
        titulo="Eliminar"
        mensaje="¿Seguro?"
        textoConfirmar="Eliminar"
        textoCancelar="Cancelar"
        onConfirmar={() => {}}
        onCancelar={() => {}}
      />,
    );

    // El foco se aplica en un setTimeout 0 dentro de Modal.
    const cancelar = await screen.findByRole('button', { name: /cancelar/i });
    await vi.waitFor(() => expect(cancelar).toHaveFocus());
  });

  test('Escape dispara onCancelar', async () => {
    const onCancelar = vi.fn();
    render(
      <DialogoConfirmacion
        abierto
        titulo="Eliminar"
        mensaje="¿Seguro?"
        onConfirmar={() => {}}
        onCancelar={onCancelar}
      />,
    );

    await userEvent.keyboard('{Escape}');
    expect(onCancelar).toHaveBeenCalledTimes(1);
  });

  test('click en Confirmar dispara onConfirmar', async () => {
    const onConfirmar = vi.fn();
    render(
      <DialogoConfirmacion
        abierto
        titulo="Eliminar"
        mensaje="¿Seguro?"
        textoConfirmar="Eliminar"
        onConfirmar={onConfirmar}
        onCancelar={() => {}}
      />,
    );

    const confirmar = screen.getByRole('button', { name: /eliminar/i });
    await userEvent.click(confirmar);
    expect(onConfirmar).toHaveBeenCalledTimes(1);
  });
});
