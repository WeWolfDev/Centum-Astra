// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, test } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Input from './Input';

afterEach(cleanup);

describe('Input', () => {
  test('asocia label con input vía htmlFor/id', () => {
    render(<Input id="correo" label="Correo electrónico" value="" onChange={() => {}} />);
    const input = screen.getByLabelText(/correo electrónico/i);
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('id', 'correo');
  });

  test('autogenera id cuando no se pasa, manteniendo la asociación con el label', () => {
    render(<Input label="Usuario" value="" onChange={() => {}} />);
    const input = screen.getByLabelText(/usuario/i);
    expect(input).toHaveAttribute('id');
    expect(input.id.length).toBeGreaterThan(0);
  });

  test('sin error no aplica aria-invalid ni mensaje visible', () => {
    render(<Input id="x" label="X" value="" onChange={() => {}} />);
    const input = screen.getByLabelText(/x/i);
    expect(input).not.toHaveAttribute('aria-invalid');
    expect(screen.queryByText(/error/i)).not.toBeInTheDocument();
  });

  test('con error aplica aria-invalid="true" y aria-describedby apuntando al mensaje', () => {
    render(
      <Input
        id="pwd"
        label="Contraseña"
        type="password"
        value=""
        onChange={() => {}}
        error="Es obligatoria"
      />,
    );
    const input = screen.getByLabelText('Contraseña', { selector: 'input' });
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('aria-describedby', 'pwd-error');
    const msg = screen.getByText(/es obligatoria/i);
    expect(msg).toHaveAttribute('id', 'pwd-error');
  });

  test('type="password" renderiza toggle con aria-label y alterna visibilidad', async () => {
    const user = userEvent.setup();
    render(<Input id="pwd" label="Contraseña" type="password" value="secreto" onChange={() => {}} />);
    const input = screen.getByLabelText('Contraseña', { selector: 'input' });
    expect(input).toHaveAttribute('type', 'password');

    const toggle = screen.getByRole('button', { name: /mostrar contraseña/i });
    expect(toggle).toHaveAttribute('aria-pressed', 'false');

    await user.click(toggle);
    expect(input).toHaveAttribute('type', 'text');
    expect(screen.getByRole('button', { name: /ocultar contraseña/i })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  test('type distinto de password no renderiza toggle', () => {
    render(<Input id="email" label="Correo" type="email" value="" onChange={() => {}} />);
    expect(
      screen.queryByRole('button', { name: /mostrar contraseña/i }),
    ).not.toBeInTheDocument();
  });

  test('concatena aria-describedby del consumidor con el id del error', () => {
    render(
      <Input
        id="n"
        label="Nombre"
        value=""
        onChange={() => {}}
        error="requerido"
        aria-describedby="hint-nombre"
      />,
    );
    const input = screen.getByLabelText(/nombre/i);
    expect(input).toHaveAttribute('aria-describedby', 'n-error hint-nombre');
  });
});
