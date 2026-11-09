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

const { requestRecoveryCode, setPasswordWithCode } = await import('./passwordFlow');

const DATOS = { email: 'a@x.mx', code: ' 123456 ', password: 'nueva-clave', type: 'recovery' };

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

describe('setPasswordWithCode', () => {
  test('valida el código, guarda la contraseña y exige iniciar sesión', async () => {
    await setPasswordWithCode(DATOS);
    expect(fake.auth.verifyOtp).toHaveBeenCalledWith({ email: 'a@x.mx', token: '123456', type: 'recovery' });
    expect(fake.auth.updateUser).toHaveBeenCalledWith({ password: 'nueva-clave' });
    expect(fake.auth.signOut).toHaveBeenCalledWith({ scope: 'global' });
  });

  test('no toca la contraseña si el código es inválido', async () => {
    fake.auth.verifyOtp.mockResolvedValue({ error: { code: 'otp_expired' } });
    await expect(setPasswordWithCode(DATOS)).rejects.toThrow('incorrecto o ya expiró');
    expect(fake.auth.updateUser).not.toHaveBeenCalled();
  });

  test('cierra la sesión del código si falla el guardado', async () => {
    fake.auth.updateUser.mockResolvedValue({ error: { code: 'weak_password' } });
    await expect(setPasswordWithCode(DATOS)).rejects.toThrow('demasiado débil');
    expect(fake.auth.signOut).toHaveBeenCalledWith({ scope: 'local' });
  });
});
