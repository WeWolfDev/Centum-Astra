import { createClient } from '@supabase/supabase-js';
import { isMockAuthAllowed } from './authService';

// Solo la URL y la clave pública (anon/publishable). La clave service_role nunca va en el frontend.
const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && anonKey);

export const supabase = isSupabaseConfigured ? createClient(url, anonKey) : null;

// Cliente aparte para el flujo de código: su sesión vive solo en memoria, así que
// recargar la página no deja a nadie dentro del sistema.
export function createCodeClient() {
  if (!isSupabaseConfigured) return null;
  return createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

export const mockAuthEnabled = isMockAuthAllowed({
  supabaseConfigured: isSupabaseConfigured,
  isDev: import.meta.env.DEV,
  showDemo: import.meta.env.VITE_SHOW_DEMO === 'true',
});
