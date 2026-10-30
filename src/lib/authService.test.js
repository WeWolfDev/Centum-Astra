import { describe, it, expect } from 'vitest';
import {
  APP_ROLES,
  authErrorMessage,
  initialsFromName,
  isMockAuthAllowed,
  toAppUser,
} from './authService';

describe('initialsFromName', () => {
  it('toma la inicial de las dos primeras palabras', () => {
    expect(initialsFromName('Ana García López')).toBe('AG');
  });

  it('devuelve una sola inicial con un solo nombre', () => {
    expect(initialsFromName('ana')).toBe('A');
  });

  it('devuelve "?" sin nombre', () => {
    expect(initialsFromName('')).toBe('?');
    expect(initialsFromName(undefined)).toBe('?');
  });
});

describe('toAppUser', () => {
  const authUser = { id: 'uuid-1', email: 'ana@centum.mx' };

  it('combina el usuario de Auth con su perfil', () => {
    const profile = { full_name: 'Ana García López', role: 'student' };
    expect(toAppUser(authUser, profile)).toEqual({
      id: 'uuid-1',
      email: 'ana@centum.mx',
      name: 'Ana García López',
      role: 'student',
      avatar: 'AG',
    });
  });

  it('usa el correo como nombre si el perfil no tiene nombre', () => {
    const user = toAppUser(authUser, { role: 'teacher' });
    expect(user.name).toBe('ana@centum.mx');
  });

  it('rechaza perfiles sin rol válido', () => {
    expect(toAppUser(authUser, { full_name: 'X', role: 'superadmin' })).toBeNull();
    expect(toAppUser(authUser, null)).toBeNull();
  });

  it('no muta los objetos recibidos', () => {
    const profile = Object.freeze({ full_name: 'Ana', role: 'admin' });
    expect(() => toAppUser(Object.freeze({ ...authUser }), profile)).not.toThrow();
  });

  it('acepta solo los roles de la app', () => {
    expect(APP_ROLES).toEqual(['admin', 'teacher', 'student']);
  });
});

describe('authErrorMessage', () => {
  it('traduce credenciales inválidas sin revelar si el correo existe', () => {
    expect(authErrorMessage({ code: 'invalid_credentials' })).toBe('Correo o contraseña incorrectos');
  });

  it('avisa de correo sin confirmar', () => {
    expect(authErrorMessage({ code: 'email_not_confirmed' })).toMatch(/confirmar/i);
  });

  it('avisa de demasiados intentos', () => {
    expect(authErrorMessage({ status: 429 })).toMatch(/intentos/i);
  });

  it('detecta errores de red', () => {
    expect(authErrorMessage({ name: 'AuthRetryableFetchError' })).toMatch(/conexión/i);
  });

  it('no expone el mensaje técnico en errores desconocidos', () => {
    const msg = authErrorMessage({ message: 'relation "profiles" does not exist' });
    expect(msg).not.toMatch(/profiles/);
    expect(msg).toMatch(/intenta de nuevo/i);
  });
});

describe('isMockAuthAllowed', () => {
  it('nunca usa mock si Supabase está configurado', () => {
    expect(isMockAuthAllowed({ supabaseConfigured: true, isDev: true, showDemo: true })).toBe(false);
  });

  it('permite mock en desarrollo sin Supabase', () => {
    expect(isMockAuthAllowed({ supabaseConfigured: false, isDev: true, showDemo: false })).toBe(true);
  });

  it('permite mock en producción solo con VITE_SHOW_DEMO', () => {
    expect(isMockAuthAllowed({ supabaseConfigured: false, isDev: false, showDemo: true })).toBe(true);
    expect(isMockAuthAllowed({ supabaseConfigured: false, isDev: false, showDemo: false })).toBe(false);
  });
});
