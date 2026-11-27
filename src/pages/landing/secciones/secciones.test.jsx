// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, test } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TarjetaAreaGiratoria from './TarjetaAreaGiratoria';
import Testimonios from './Testimonios';
import { SeccionPadres } from './SeccionesHistoria';

afterEach(cleanup);

describe('TarjetaAreaGiratoria', () => {
  test('al tocarla se voltea y muestra qué se ve en el área; al tocarla otra vez regresa', async () => {
    render(<TarjetaAreaGiratoria titulo="Pensamiento Matemático" imagen="/x.jpg" descripcion="Aritmética y álgebra." />);
    const tarjeta = screen.getByRole('button', { name: /Pensamiento Matemático/ });
    expect(tarjeta).toHaveAttribute('aria-pressed', 'false');

    await userEvent.click(tarjeta);
    expect(tarjeta).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('Aritmética y álgebra.')).toBeVisible();

    await userEvent.click(tarjeta);
    expect(tarjeta).toHaveAttribute('aria-pressed', 'false');
  });
});

describe('Testimonios', () => {
  test('sin testimonios todavía, muestra tarjetas marcadas como ejemplo y no inventa nombres', () => {
    render(<Testimonios testimonios={[]} />);
    const tarjetas = within(screen.getByRole('list', { name: 'Testimonios' })).getAllByRole('listitem');
    expect(tarjetas.length).toBeGreaterThan(1);
    tarjetas.forEach(t => expect(t).toHaveTextContent('Ejemplo'));
  });

  test('con testimonios, muestra cada uno con su nombre y carrera', () => {
    render(<Testimonios testimonios={[{ id: 1, nombre: 'Andrea M.', carrera: 'Medicina', texto: 'Practiqué todos los días.' }]} />);
    const tarjeta = within(screen.getByRole('list', { name: 'Testimonios' })).getByRole('listitem');
    expect(tarjeta).toHaveTextContent('Andrea M.');
    expect(tarjeta).toHaveTextContent('Medicina');
    expect(tarjeta).not.toHaveTextContent('Ejemplo');
  });

  test('se recorre con botones, además de deslizar', () => {
    render(<Testimonios testimonios={[]} />);
    expect(screen.getByRole('button', { name: 'Testimonio anterior' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Testimonio siguiente' })).toBeInTheDocument();
  });
});

describe('SeccionPadres', () => {
  test('dice que es 100 % en línea, con sus horarios, y manda a pedir informes en vez de dar el precio', () => {
    render(<SeccionPadres />);
    expect(screen.getByText(/100 % en línea/)).toBeInTheDocument();
    expect(screen.getByText(/martes y jueves, de 7:00 a 9:00 p\. m\./i)).toBeInTheDocument();
    expect(screen.getByText(/sábados, de 8:00 a\. m\. a 12:00 p\. m\./i)).toBeInTheDocument();
    expect(screen.queryByText(/\$4,500/)).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /pide informes/i })).toHaveAttribute('href', '#registro');
  });
});
