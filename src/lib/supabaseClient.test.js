import { afterEach, describe, expect, test, vi } from 'vitest';

const createClient = vi.hoisted(() => vi.fn(() => ({})));
vi.mock('@supabase/supabase-js', () => ({ createClient }));

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
  createClient.mockClear();
});

describe('createCodeClient', () => {
  test('crea un cliente que no guarda la sesión en localStorage', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://x.supabase.co');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'anon');
    const { createCodeClient } = await import('./supabaseClient');
    createClient.mockClear();
    createCodeClient();
    expect(createClient).toHaveBeenCalledWith('https://x.supabase.co', 'anon', {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
  });

  test('sin configuración no crea cliente', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', '');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', '');
    const { createCodeClient } = await import('./supabaseClient');
    expect(createCodeClient()).toBeNull();
  });
});
