import { beforeEach, describe, expect, test, vi } from 'vitest';

const fake = vi.hoisted(() => ({
  auth: {
    resetPasswordForEmail: vi.fn(),
    verifyOtp: vi.fn(),
    updateUser: vi.fn(),
    signOut: vi.fn(),
  },
}));

vi.mock('./supabaseClient', () => ({ supabase: { auth: fake.auth } }));

const { requestRecoveryCode, verifyCode, savePassword, cancelPasswordFlow } = await import('./passwordFlow');

const DATOS = { email: 'a@x.mx', code: ' 123456 ', type: 'recovery' };

beforeEach(() => {
  Object.values(fake.auth).forEach(fn => fn.mockReset());
  fake.auth.resetPasswordForEmail.mockResolvedValue({ error: null });
  fake.auth.verifyOtp.mockResolvedValue({ error: null });
  fake.auth.updateUser.mockResolvedValue({ error: null });
  fake.auth.signOut.mockResolvedValue({ error: null });
});

describe('requestRecoveryCode', () => {
  test('no revela si el correo existe', async () => {
    fake.auth.resetPasswordForEmail.mockResolvedValue({ error: { code: 'user_not_found', status: 400 } });
    await expect(requestRecoveryCode('x@x.mx')).resolves.toBeUndefined();
  });

  test('informa el límite de envíos', async () => {
    fake.auth.resetPasswordForEmail.mockResolvedValue({ error: { status: 429 } });
    await expect(requestRecoveryCode('x@x.mx')).rejects.toThrow('Demasiados intentos');
  });
});

describe('verifyCode', () => {
  test('valida el código sin espacios', async () => {
    await verifyCode(DATOS);
    expect(fake.auth.verifyOtp).toHaveBeenCalledWith({ email: 'a@x.mx', token: '123456', type: 'recovery' });
  });

  test('informa un código inválido o expirado', async () => {
    fake.auth.verifyOtp.mockResolvedValue({ error: { code: 'otp_expired' } });
    await expect(verifyCode(DATOS)).rejects.toThrow('incorrecto o ya expiró');
  });
});

describe('savePassword', () => {
  test('guarda la contraseña y exige iniciar sesión en todos los dispositivos', async () => {
    await savePassword('nueva-clave');
    expect(fake.auth.updateUser).toHaveBeenCalledWith({ password: 'nueva-clave' });
    expect(fake.auth.signOut).toHaveBeenCalledWith({ scope: 'global' });
  });

  test('conserva la sesión del código si la contraseña se rechaza', async () => {
    fake.auth.updateUser.mockResolvedValue({ error: { code: 'weak_password' } });
    await expect(savePassword('corta')).rejects.toThrow('demasiado débil');
    expect(fake.auth.signOut).not.toHaveBeenCalled();
  });

  test('pide una contraseña distinta a la anterior', async () => {
    fake.auth.updateUser.mockResolvedValue({ error: { code: 'same_password' } });
    await expect(savePassword('misma')).rejects.toThrow('distinta a la anterior');
  });
});

describe('cancelPasswordFlow', () => {
  test('cierra solo la sesión local del código', async () => {
    await cancelPasswordFlow();
    expect(fake.auth.signOut).toHaveBeenCalledWith({ scope: 'local' });
  });
});
