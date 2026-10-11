// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { useState } from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Pestanas from './Pestanas';
import SelectorAreas from './SelectorAreas';

afterEach(cleanup);

const MODULOS = [
  { id: 1, title: 'Pensamiento Matemático' },
  { id: 2, title: 'Comprensión Lectora' },
  { id: 3, title: 'Redacción Indirecta' },
  { id: 4, title: 'Pre-medicina' },
  { id: 5, title: 'Ciencias de la Salud' },
];

function Host({ onCambio, valorInicial = 1 } = {}) {
  const [valor, setValor] = useState(valorInicial);
  return (
    <Pestanas
      valor={valor}
      onCambio={(v) => {
        setValor(v);
        onCambio?.(v);
      }}
      aria-label="Materias"
    >
      <SelectorAreas modulos={MODULOS} />
      {MODULOS.map((m) => (
        <Pestanas.Panel key={m.id} valor={m.id}>
          <p>Contenido de {m.title}</p>
        </Pestanas.Panel>
      ))}
    </Pestanas>
  );
}

describe('SelectorAreas', () => {
  test('renderiza role=tablist con las 5 áreas', () => {
    render(<Host />);
    expect(screen.getByRole('tablist', { name: /materias/i })).toBeInTheDocument();
    expect(screen.getAllByRole('tab')).toHaveLength(5);
  });

  test('el tab activo tiene aria-selected y data-activa en true, los demás false', () => {
    render(<Host valorInicial={3} />);
    const activo = screen.getByRole('tab', { name: /redacción indirecta/i });
    const otro = screen.getByRole('tab', { name: /pensamiento matemático/i });
    expect(activo).toHaveAttribute('aria-selected', 'true');
    expect(activo).toHaveAttribute('data-activa', 'true');
    expect(otro).toHaveAttribute('aria-selected', 'false');
    expect(otro).toHaveAttribute('data-activa', 'false');
  });

  test('cada tab tiene aria-controls que apunta a su tabpanel real', () => {
    render(<Host />);
    const tab = screen.getByRole('tab', { name: /comprensión lectora/i });
    const panelId = tab.getAttribute('aria-controls');
    expect(panelId).toBeTruthy();
    const panel = document.getElementById(panelId);
    expect(panel).not.toBeNull();
    expect(panel.getAttribute('role')).toBe('tabpanel');
    expect(panel.getAttribute('aria-labelledby')).toBe(tab.id);
  });

  test('click en una pestaña cambia la selección y hace visible su panel', async () => {
    const onCambio = vi.fn();
    const user = userEvent.setup();
    render(<Host onCambio={onCambio} />);
    await user.click(screen.getByRole('tab', { name: /pre-medicina/i }));
    expect(onCambio).toHaveBeenCalledWith(4);
    expect(screen.getByRole('tab', { name: /pre-medicina/i })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByRole('tabpanel', { name: /pre-medicina/i })).toBeVisible();
  });

  test('las flechas navegan entre pestañas con wrap-around', async () => {
    const user = userEvent.setup();
    render(<Host valorInicial={1} />);
    screen.getByRole('tab', { name: /pensamiento matemático/i }).focus();
    await user.keyboard('{ArrowLeft}');
    expect(screen.getByRole('tab', { name: /ciencias de la salud/i })).toHaveFocus();
  });

  test('tab activo lleva el borde dorado por data-activa', () => {
    render(<Host valorInicial={2} />);
    const tab = screen.getByRole('tab', { name: /comprensión lectora/i });
    // La clase condicional vive en el className como data-[activa=true]:ring-gold-bright;
    // en el DOM aparece siempre, es el selector CSS el que la activa.
    expect(tab.className).toMatch(/data-\[activa=true\]:ring-gold-bright/);
  });

  test('foco teclado dorado del sistema aplicado a cada tab', () => {
    render(<Host />);
    for (const tab of screen.getAllByRole('tab')) {
      expect(tab).toHaveClass('focus-visible:ring-gold-bright');
    }
  });

  test('cada tab renderiza una imagen decorativa (alt="") con lazy loading', () => {
    render(<Host />);
    const tab = screen.getByRole('tab', { name: /pensamiento matemático/i });
    const img = tab.querySelector('img');
    expect(img).not.toBeNull();
    expect(img).toHaveAttribute('alt', '');
    expect(img).toHaveAttribute('loading', 'lazy');
    expect(img).toHaveAttribute('width', '800');
    expect(img).toHaveAttribute('height', '533');
  });

  test('tablist admite scroll horizontal (overflow-x-auto + tabs flex-shrink-0)', () => {
    render(<Host />);
    const tablist = screen.getByRole('tablist', { name: /materias/i });
    expect(tablist).toHaveClass('overflow-x-auto');
    const tab = screen.getByRole('tab', { name: /pensamiento matemático/i });
    expect(tab).toHaveClass('flex-shrink-0');
    expect(tab).toHaveClass('min-w-[132px]');
  });

  test('tabs son flex-1 para repartir ancho equitativamente en pantallas amplias', () => {
    render(<Host />);
    for (const tab of screen.getAllByRole('tab')) {
      expect(tab).toHaveClass('flex-1');
      expect(tab).toHaveClass('min-h-[76px]');
    }
  });
});
