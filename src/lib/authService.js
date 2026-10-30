// Lógica pura de autenticación (sin React ni red) para poder probarla aislada.

export const APP_ROLES = ['admin', 'teacher', 'student'];

const GENERIC_ERROR = 'No pudimos iniciar sesión. Intenta de nuevo en unos minutos.';
const HTTP_TOO_MANY_REQUESTS = 429;

/**
 * @param {string | undefined} name
 * @returns {string}
 */
export function initialsFromName(name) {
  const words = (name ?? '').trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  return words.slice(0, 2).map(w => w[0].toUpperCase()).join('');
}

/**
 * Combina el usuario de Supabase Auth con su fila en `profiles`.
 * Devuelve null si el perfil no existe o su rol no es de la app.
 * @param {{ id: string, email?: string }} authUser
 * @param {{ full_name?: string, role?: string } | null} profile
 * @returns {{ id: string, email: string, name: string, role: string, avatar: string } | null}
 */
export function toAppUser(authUser, profile) {
  if (!profile || !APP_ROLES.includes(profile.role)) return null;
  const email = authUser.email ?? '';
  const name = profile.full_name?.trim() || email;
  return { id: authUser.id, email, name, role: profile.role, avatar: initialsFromName(name) };
}

/**
 * Traduce errores de Supabase Auth a mensajes para el usuario sin filtrar detalles técnicos.
 * @param {{ code?: string, status?: number, name?: string, message?: string } | null} error
 * @returns {string}
 */
export function authErrorMessage(error) {
  if (error?.code === 'invalid_credentials') return 'Correo o contraseña incorrectos';
  if (error?.code === 'email_not_confirmed') return 'Debes confirmar tu correo antes de iniciar sesión.';
  if (error?.status === HTTP_TOO_MANY_REQUESTS) return 'Demasiados intentos. Espera unos minutos e intenta de nuevo.';
  if (error?.name === 'AuthRetryableFetchError') return 'Sin conexión con el servidor. Revisa tu conexión e intenta de nuevo.';
  return GENERIC_ERROR;
}

/**
 * Las cuentas mock solo autentican sin Supabase, y en producción solo con VITE_SHOW_DEMO.
 * @param {{ supabaseConfigured: boolean, isDev: boolean, showDemo: boolean }} env
 * @returns {boolean}
 */
export function isMockAuthAllowed({ supabaseConfigured, isDev, showDemo }) {
  if (supabaseConfigured) return false;
  return isDev || showDemo;
}
