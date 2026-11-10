// Recuperación de contraseña y activación de cuentas invitadas con código por correo.
import { supabase } from './supabaseClient';

const HTTP_TOO_MANY_REQUESTS = 429;
const RATE_LIMIT = 'Demasiados intentos. Espera unos minutos e intenta de nuevo.';
const NO_CONNECTION = 'Sin conexión con el servidor. Revisa tu conexión e intenta de nuevo.';
const GENERIC = 'No pudimos completar la solicitud. Intenta de nuevo.';

function esLimite(error) {
  return error?.status === HTTP_TOO_MANY_REQUESTS;
}

function esRed(error) {
  return error?.name === 'AuthRetryableFetchError';
}

function mensajeDeError(error) {
  if (esLimite(error)) return RATE_LIMIT;
  if (esRed(error)) return NO_CONNECTION;
  if (error?.code === 'otp_expired' || error?.code === 'invalid_otp') {
    return 'El código es incorrecto o ya expiró.';
  }
  if (error?.code === 'weak_password') return 'La contraseña es demasiado débil. Usa una más larga.';
  if (error?.code === 'same_password') return 'La nueva contraseña debe ser distinta a la anterior.';
  return GENERIC;
}

/**
 * No revela si el correo existe: solo falla por límite de envíos o sin conexión.
 * @param {string} email
 */
export async function requestRecoveryCode(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email);
  if (error && (esLimite(error) || esRed(error))) throw new Error(mensajeDeError(error));
}

/**
 * Valida el código. Su sesión queda abierta para que, si la contraseña se
 * rechaza, se pueda reintentar el guardado sin gastar otro código.
 * @param {{ email: string, code: string, type: 'recovery' | 'invite' }} datos
 */
export async function verifyCode({ email, code, type }) {
  const { error } = await supabase.auth.verifyOtp({ email, token: code.trim(), type });
  if (error) throw new Error(mensajeDeError(error));
}

/**
 * Guarda la contraseña con la sesión del código y la cierra en todos los
 * dispositivos para exigir un inicio de sesión nuevo.
 * @param {string} password
 */
export async function savePassword(password) {
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw new Error(mensajeDeError(error));
  await supabase.auth.signOut({ scope: 'global' });
}

/** Cierra la sesión del código cuando se abandona el flujo sin guardar. */
export async function cancelPasswordFlow() {
  await supabase.auth.signOut({ scope: 'local' });
}
