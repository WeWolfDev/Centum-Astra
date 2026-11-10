// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, useModoOscuroForzado } from '../../context/ThemeContext';
import { TEMA_STORAGE_KEY } from '../../lib/tema';
import BotonTema from './BotonTema';

function renderizar(habilitado) {
  return render(
    <ThemeProvider habilitado={habilitado}>
      <BotonTema />
    </ThemeProvider>,
  );
}

beforeEach(() => {
  localStorage.clear();
  delete document.documentElement.dataset.theme;
});
afterEach(cleanup);

describe('BotonTema', () => {
  test('con el flag apagado no se muestra y queda el modo oscuro', () => {
    renderizar(false);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(document.documentElement.dataset.theme).toBe('dark');
  });

  test('cambia a modo claro y recuerda la elección', async () => {
    renderizar(true);
    await userEvent.click(screen.getByRole('button', { name: 'Activar modo claro' }));

    expect(document.documentElement.dataset.theme).toBe('light');
    expect(localStorage.getItem(TEMA_STORAGE_KEY)).toBe('light');
    expect(screen.getByRole('button', { name: 'Activar modo oscuro' })).toBeInTheDocument();
  });

  test('vuelve a modo oscuro', async () => {
    localStorage.setItem(TEMA_STORAGE_KEY, 'light');
    renderizar(true);
    await userEvent.click(screen.getByRole('button', { name: 'Activar modo oscuro' }));

    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(localStorage.getItem(TEMA_STORAGE_KEY)).toBe('dark');
  });

  test('sin elección previa no guarda nada hasta que el usuario cambia', () => {
    renderizar(true);
    expect(localStorage.getItem(TEMA_STORAGE_KEY)).toBeNull();
  });
});

describe('useModoOscuroForzado', () => {
  function PaginaPublica() {
    useModoOscuroForzado();
    return null;
  }

  test('fuerza el modo oscuro mientras la página pública está montada', () => {
    localStorage.setItem(TEMA_STORAGE_KEY, 'light');
    const { rerender } = render(
      <ThemeProvider habilitado>
        <PaginaPublica />
      </ThemeProvider>,
    );
    expect(document.documentElement.dataset.theme).toBe('dark');

    rerender(<ThemeProvider habilitado><BotonTema /></ThemeProvider>);
    expect(document.documentElement.dataset.theme).toBe('light');
  });
});
