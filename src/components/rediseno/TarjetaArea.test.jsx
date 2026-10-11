// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TarjetaArea from './TarjetaArea';

afterEach(cleanup);

describe('TarjetaArea', () => {
  test('renderiza imagen de fondo decorativa (alt vacío) con lazy y dimensiones', () => {
    render(
      <TarjetaArea
        titulo="Pensamiento Matemático"
        icono="math"
        imagen="/stub-math.jpg"
        onClick={() => {}}
      />,
    );
    const boton = screen.getByRole('button', {
      name: /abrir área pensamiento matemático/i,
    });
    const img = boton.querySelector('img');
    expect(img).not.toBeNull();
    expect(img).toHaveAttribute('alt', '');
    expect(img).toHaveAttribute('loading', 'lazy');
    expect(img).toHaveAttribute('width', '800');
    expect(img).toHaveAttribute('height', '533');
    expect(img).toHaveAttribute('src', '/stub-math.jpg');
  });

  test('sin prop imagen usa fallback de degradado y no renderiza <img>', () => {
    render(
      <TarjetaArea titulo="Redacción Indirecta" icono="writing" onClick={() => {}} />,
    );
    const boton = screen.getByRole('button', {
      name: /abrir área redacción indirecta/i,
    });
    expect(boton.querySelector('img')).toBeNull();
    expect(boton.querySelector('span.bg-gradient-to-br')).not.toBeNull();
  });

  test('invoca onClick al activar', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<TarjetaArea titulo="Pre-medicina" icono="premed" onClick={onClick} />);
    await user.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  test('aria-label se puede sobrescribir', () => {
    render(
      <TarjetaArea
        titulo="Ciencias de la Salud"
        icono="health"
        onClick={() => {}}
        ariaLabel="Ir a Ciencias de la Salud"
      />,
    );
    expect(
      screen.getByRole('button', { name: /ir a ciencias de la salud/i }),
    ).toBeInTheDocument();
  });

  test('intensidadTinte media por defecto aplica bg-space-navy/55', () => {
    const { container } = render(
      <TarjetaArea titulo="X" icono="math" onClick={() => {}} />,
    );
    expect(container.querySelector('.bg-space-navy\\/55')).not.toBeNull();
  });

  test('intensidadTinte="suave" aplica bg-space-navy/35', () => {
    const { container } = render(
      <TarjetaArea
        titulo="X"
        icono="math"
        onClick={() => {}}
        intensidadTinte="suave"
      />,
    );
    expect(container.querySelector('.bg-space-navy\\/35')).not.toBeNull();
    expect(container.querySelector('.bg-space-navy\\/55')).toBeNull();
  });

  test('intensidadTinte="fuerte" aplica bg-space-navy/75', () => {
    const { container } = render(
      <TarjetaArea
        titulo="X"
        icono="math"
        onClick={() => {}}
        intensidadTinte="fuerte"
      />,
    );
    expect(container.querySelector('.bg-space-navy\\/75')).not.toBeNull();
  });

  test('flecha decorativa tiene aria-hidden="true"', () => {
    const { container } = render(
      <TarjetaArea titulo="X" icono="math" onClick={() => {}} />,
    );
    // Lucide ArrowRight se renderiza como <svg> y aria-hidden propagado.
    const svgs = container.querySelectorAll('svg[aria-hidden="true"]');
    // Al menos: la flecha y el icono de materia.
    expect(svgs.length).toBeGreaterThanOrEqual(2);
  });

  test('botón usa anillo de foco dorado del sistema', () => {
    render(<TarjetaArea titulo="X" icono="math" onClick={() => {}} />);
    const boton = screen.getByRole('button');
    expect(boton).toHaveClass('focus-visible:ring-gold-bright');
    expect(boton).toHaveClass('focus-visible:ring-offset-space-void');
  });
});
