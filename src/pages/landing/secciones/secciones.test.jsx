// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, test } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import CalculadoraPuntaje from './CalculadoraPuntaje';
import Testimonios from './Testimonios';

afterEach(cleanup);

describe('CalculadoraPuntaje', () => {
  test('con 60 de 100 aciertos da 1,060, y cambia al mover el control', () => {
    render(<CalculadoraPuntaje />);
    expect(screen.getByText('1,060')).toBeInTheDocument();

    fireEvent.change(screen.getByRole('slider', { name: 'Aciertos de 100' }), { target: { value: '85' } });

    expect(screen.getByText('1,210')).toBeInTheDocument();
    expect(screen.getByText(/no es resultado oficial del EXANI-II/i)).toBeInTheDocument();
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
