// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Boton from './Boton';

afterEach(cleanup);

describe('Boton', () => {
  test('renderiza como <button type=button> por defecto', () => {
    render(<Boton>Guardar</Boton>);
    const b = screen.getByRole('button', { name: /guardar/i });
    expect(b).toHaveAttribute('type', 'button');
  });

  test('variante primario default usa btn-gold-flat', () => {
    render(<Boton>Primario</Boton>);
    expect(screen.getByRole('button')).toHaveClass('btn-gold-flat');
  });

  test('variante secundario default usa btn-flat-secundario', () => {
    render(<Boton variant="secundario">Secundario</Boton>);
    expect(screen.getByRole('button')).toHaveClass('btn-flat-secundario');
  });

  test('size="sm" aplica altura 32px y texto chico, sin btn-gold-flat', () => {
    render(<Boton size="sm">Pequeño</Boton>);
    const b = screen.getByRole('button', { name: /pequeño/i });
    expect(b).toHaveClass('h-8');
    expect(b).toHaveClass('text-xs');
    expect(b).not.toHaveClass('btn-gold-flat');
  });

  test('size="sm" tiene floor min-h-6 (24px) por accesibilidad táctil', () => {
    render(<Boton size="sm">Pequeño</Boton>);
    expect(screen.getByRole('button')).toHaveClass('min-h-6');
  });

  test('size="sm" variante secundario compone estilos tailwind, sin btn-flat-secundario', () => {
    render(<Boton size="sm" variant="secundario">Pequeño sec</Boton>);
    const b = screen.getByRole('button');
    expect(b).toHaveClass('bg-white/5');
    expect(b).not.toHaveClass('btn-flat-secundario');
  });

  test('isLoading muestra aria-busy y bloquea el click', async () => {
    const onClick = vi.fn();
    render(
      <Boton isLoading onClick={onClick}>
        Guardando
      </Boton>,
    );
    const b = screen.getByRole('button');
    expect(b).toHaveAttribute('aria-busy', 'true');
    expect(b).toBeDisabled();

    await userEvent.click(b);
    expect(onClick).not.toHaveBeenCalled();
  });

  test('disabled bloquea el click', async () => {
    const onClick = vi.fn();
    render(
      <Boton disabled onClick={onClick}>
        Guardar
      </Boton>,
    );
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
  });

  test('onClick se dispara en estado normal', async () => {
    const onClick = vi.fn();
    render(<Boton onClick={onClick}>Guardar</Boton>);
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
