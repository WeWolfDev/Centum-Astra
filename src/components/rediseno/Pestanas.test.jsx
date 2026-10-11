// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { useState } from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Pestanas from './Pestanas';

afterEach(cleanup);

function Host({ onCambio, valorInicial = 'a' } = {}) {
  const [valor, setValor] = useState(valorInicial);
  function handleCambio(v) {
    setValor(v);
    onCambio?.(v);
  }
  return (
    <Pestanas valor={valor} onCambio={handleCambio} aria-label="Pestanas de prueba">
      <Pestanas.Lista>
        <Pestanas.Tab valor="a">Alpha</Pestanas.Tab>
        <Pestanas.Tab valor="b">Beta</Pestanas.Tab>
        <Pestanas.Tab valor="c">Gamma</Pestanas.Tab>
      </Pestanas.Lista>
      <Pestanas.Panel valor="a">
        <p>Panel A</p>
      </Pestanas.Panel>
      <Pestanas.Panel valor="b">
        <p>Panel B</p>
      </Pestanas.Panel>
      <Pestanas.Panel valor="c">
        <p>Panel C</p>
      </Pestanas.Panel>
    </Pestanas>
  );
}

describe('Pestanas', () => {
  test('renderiza un tablist con todos los tabs y paneles', () => {
    render(<Host />);
    expect(screen.getByRole('tablist', { name: /pestanas de prueba/i })).toBeInTheDocument();
    expect(screen.getAllByRole('tab')).toHaveLength(3);
    // Los paneles están todos en el DOM, solo uno visible.
    expect(screen.getAllByRole('tabpanel', { hidden: true })).toHaveLength(3);
  });

  test('exactamente un tab tiene aria-selected="true" y su panel está visible', () => {
    render(<Host />);
    const alpha = screen.getByRole('tab', { name: /alpha/i });
    const beta = screen.getByRole('tab', { name: /beta/i });
    const gamma = screen.getByRole('tab', { name: /gamma/i });

    expect(alpha).toHaveAttribute('aria-selected', 'true');
    expect(beta).toHaveAttribute('aria-selected', 'false');
    expect(gamma).toHaveAttribute('aria-selected', 'false');

    // Panel visible: hidden=false; panel A visible, el resto hidden.
    expect(screen.getByRole('tabpanel', { name: /alpha/i })).toBeVisible();
  });

  test('click en un tab cambia la selección y notifica via onCambio', async () => {
    const onCambio = vi.fn();
    const user = userEvent.setup();
    render(<Host onCambio={onCambio} />);

    await user.click(screen.getByRole('tab', { name: /beta/i }));

    expect(onCambio).toHaveBeenCalledWith('b');
    expect(screen.getByRole('tab', { name: /beta/i })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tabpanel', { name: /beta/i })).toBeVisible();
  });

  test('flecha derecha mueve selección y foco al siguiente tab, con wrap al inicio', async () => {
    const user = userEvent.setup();
    render(<Host valorInicial="a" />);

    const alpha = screen.getByRole('tab', { name: /alpha/i });
    alpha.focus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: /beta/i })).toHaveFocus();
    expect(screen.getByRole('tab', { name: /beta/i })).toHaveAttribute('aria-selected', 'true');

    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: /gamma/i })).toHaveFocus();

    // Wrap desde el último al primero.
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: /alpha/i })).toHaveFocus();
    expect(screen.getByRole('tab', { name: /alpha/i })).toHaveAttribute('aria-selected', 'true');
  });

  test('flecha izquierda mueve selección al previo, con wrap al final', async () => {
    const user = userEvent.setup();
    render(<Host valorInicial="a" />);
    screen.getByRole('tab', { name: /alpha/i }).focus();

    await user.keyboard('{ArrowLeft}');
    expect(screen.getByRole('tab', { name: /gamma/i })).toHaveFocus();
    expect(screen.getByRole('tab', { name: /gamma/i })).toHaveAttribute('aria-selected', 'true');
  });

  test('Home y End saltan al primer / último tab', async () => {
    const user = userEvent.setup();
    render(<Host valorInicial="b" />);
    screen.getByRole('tab', { name: /beta/i }).focus();

    await user.keyboard('{End}');
    expect(screen.getByRole('tab', { name: /gamma/i })).toHaveFocus();
    expect(screen.getByRole('tab', { name: /gamma/i })).toHaveAttribute('aria-selected', 'true');

    await user.keyboard('{Home}');
    expect(screen.getByRole('tab', { name: /alpha/i })).toHaveFocus();
    expect(screen.getByRole('tab', { name: /alpha/i })).toHaveAttribute('aria-selected', 'true');
  });

  test('solo el tab seleccionado está en el orden de tabulación (tabindex 0 / -1)', () => {
    render(<Host valorInicial="b" />);
    expect(screen.getByRole('tab', { name: /alpha/i })).toHaveAttribute('tabindex', '-1');
    expect(screen.getByRole('tab', { name: /beta/i })).toHaveAttribute('tabindex', '0');
    expect(screen.getByRole('tab', { name: /gamma/i })).toHaveAttribute('tabindex', '-1');
  });

  test('aria-controls en el tab apunta al id del panel y aria-labelledby a la inversa', () => {
    render(<Host />);
    const alpha = screen.getByRole('tab', { name: /alpha/i });
    const panelId = alpha.getAttribute('aria-controls');
    expect(panelId).toBeTruthy();
    const panel = document.getElementById(panelId);
    expect(panel).not.toBeNull();
    expect(panel.getAttribute('aria-labelledby')).toBe(alpha.id);
  });
});
