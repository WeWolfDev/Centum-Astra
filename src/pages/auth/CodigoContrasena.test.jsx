// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const flujo = vi.hoisted(() => ({
  requestRecoveryCode: vi.fn(),
  verifyCode: vi.fn(),
  savePassword: vi.fn(),
  cancelPasswordFlow: vi.fn(),
}));

vi.mock('../../lib/passwordFlow', () => flujo);

const { default: CodigoContrasena } = await import('./CodigoContrasena');

const onVolver = vi.fn();

beforeEach(() => {
  Object.values(flujo).forEach(fn => fn.mockReset().mockResolvedValue(undefined));
  onVolver.mockReset();
});
afterEach(cleanup);

async function llenar({ codigo = '123456', password = 'clave-segura', confirmacion = password } = {}) {
  await userEvent.type(screen.getByLabelText('Correo electrónico'), 'ana@x.mx');
  await userEvent.type(screen.getByLabelText('Código de verificación'), codigo);
  await userEvent.type(screen.getByLabelText('Nueva contraseña'), password);
  await userEvent.type(screen.getByLabelText('Confirmar contraseña'), confirmacion);
}

const guardar = () => userEvent.click(screen.getByRole('button', { name: 'Guardar contraseña' }));

describe('CodigoContrasena', () => {
  test('recuperación: pide el código y pasa a confirmarlo', async () => {
    render(<CodigoContrasena tipo="recovery" onVolver={onVolver} />);
    expect(screen.queryByLabelText('Código de verificación')).not.toBeInTheDocument();

    await userEvent.type(screen.getByLabelText('Correo electrónico'), 'ana@x.mx');
    await userEvent.click(screen.getByRole('button', { name: 'Enviar código' }));

    expect(flujo.requestRecoveryCode).toHaveBeenCalledWith('ana@x.mx');
    expect(await screen.findByRole('status')).toHaveTextContent('recibirás un código');
    expect(screen.getByLabelText('Código de verificación')).toBeInTheDocument();
  });

  test('recuperación: muestra el error si no se pudo enviar el código', async () => {
    flujo.requestRecoveryCode.mockRejectedValue(new Error('Demasiados intentos.'));
    render(<CodigoContrasena tipo="recovery" onVolver={onVolver} />);

    await userEvent.type(screen.getByLabelText('Correo electrónico'), 'ana@x.mx');
    await userEvent.click(screen.getByRole('button', { name: 'Enviar código' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Demasiados intentos.');
    expect(screen.queryByLabelText('Código de verificación')).not.toBeInTheDocument();
  });

  test('activación: valida el código, guarda y vuelve con el aviso de éxito', async () => {
    render(<CodigoContrasena tipo="invite" onVolver={onVolver} />);
    await llenar();
    await guardar();

    expect(flujo.verifyCode).toHaveBeenCalledWith({ email: 'ana@x.mx', code: '123456', type: 'invite' });
    expect(flujo.savePassword).toHaveBeenCalledWith('clave-segura');
    expect(onVolver).toHaveBeenCalledWith('Cuenta activada. Inicia sesión con tu nueva contraseña.');
  });

  test('no envía nada si las contraseñas no coinciden', async () => {
    render(<CodigoContrasena tipo="invite" onVolver={onVolver} />);
    await llenar({ confirmacion: 'otra-clave' });
    await guardar();

    expect(screen.getByRole('alert')).toHaveTextContent('Las contraseñas no coinciden.');
    expect(flujo.verifyCode).not.toHaveBeenCalled();
  });

  test('no guarda la contraseña si el código es inválido', async () => {
    flujo.verifyCode.mockRejectedValue(new Error('El código es incorrecto o ya expiró.'));
    render(<CodigoContrasena tipo="invite" onVolver={onVolver} />);
    await llenar();
    await guardar();

    expect(await screen.findByRole('alert')).toHaveTextContent('incorrecto o ya expiró');
    expect(flujo.savePassword).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Código de verificación')).toBeEnabled();
  });

  test('si se rechaza la contraseña, reintenta sin volver a gastar el código', async () => {
    flujo.savePassword.mockRejectedValueOnce(new Error('La contraseña es demasiado débil.'));
    render(<CodigoContrasena tipo="recovery" onVolver={onVolver} />);
    await userEvent.type(screen.getByLabelText('Correo electrónico'), 'ana@x.mx');
    await userEvent.click(screen.getByRole('button', { name: 'Enviar código' }));
    await screen.findByLabelText('Código de verificación');
    await userEvent.type(screen.getByLabelText('Código de verificación'), '123456');
    await userEvent.type(screen.getByLabelText('Nueva contraseña'), 'corta');
    await userEvent.type(screen.getByLabelText('Confirmar contraseña'), 'corta');
    await guardar();

    expect(await screen.findByRole('alert')).toHaveTextContent('demasiado débil');
    expect(screen.getByLabelText('Código de verificación')).toBeDisabled();

    await userEvent.clear(screen.getByLabelText('Nueva contraseña'));
    await userEvent.clear(screen.getByLabelText('Confirmar contraseña'));
    await userEvent.type(screen.getByLabelText('Nueva contraseña'), 'clave-mas-larga');
    await userEvent.type(screen.getByLabelText('Confirmar contraseña'), 'clave-mas-larga');
    await guardar();

    expect(flujo.verifyCode).toHaveBeenCalledTimes(1);
    expect(flujo.savePassword).toHaveBeenLastCalledWith('clave-mas-larga');
    expect(onVolver).toHaveBeenCalledWith('Contraseña actualizada. Inicia sesión con tu nueva contraseña.');
    expect(flujo.cancelPasswordFlow).not.toHaveBeenCalled();
  });

  test('al volver con el código ya validado, cierra su sesión', async () => {
    flujo.savePassword.mockRejectedValue(new Error('La contraseña es demasiado débil.'));
    render(<CodigoContrasena tipo="invite" onVolver={onVolver} />);
    await llenar({ password: 'corta' });
    await guardar();
    await screen.findByRole('alert');

    await userEvent.click(screen.getByRole('button', { name: 'Volver a iniciar sesión' }));

    expect(flujo.cancelPasswordFlow).toHaveBeenCalledTimes(1);
    expect(onVolver).toHaveBeenCalledWith('');
  });

  test('al volver sin haber validado el código, no toca la sesión', async () => {
    render(<CodigoContrasena tipo="invite" onVolver={onVolver} />);
    await userEvent.click(screen.getByRole('button', { name: 'Volver a iniciar sesión' }));

    expect(flujo.cancelPasswordFlow).not.toHaveBeenCalled();
    expect(onVolver).toHaveBeenCalledWith('');
  });

  test('si se desmonta con el código validado, cierra su sesión', async () => {
    flujo.savePassword.mockRejectedValue(new Error('La contraseña es demasiado débil.'));
    const { unmount } = render(<CodigoContrasena tipo="invite" onVolver={onVolver} />);
    await llenar({ password: 'corta' });
    await guardar();
    await screen.findByRole('alert');

    unmount();

    expect(flujo.cancelPasswordFlow).toHaveBeenCalledTimes(1);
  });
});
