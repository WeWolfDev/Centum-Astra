// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { act } from 'react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const fake = vi.hoisted(() => {
  const listeners = [];
  const maybeSingle = vi.fn();
  return {
    listeners,
    maybeSingle,
    supabase: {
      auth: {
        getSession: vi.fn(),
        signInWithPassword: vi.fn(),
        signOut: vi.fn(),
        onAuthStateChange: vi.fn(cb => {
          listeners.push(cb);
          return { data: { subscription: { unsubscribe: vi.fn() } } };
        }),
      },
      from: vi.fn(() => ({ select: () => ({ eq: () => ({ maybeSingle }) }) })),
    },
  };
});

vi.mock('../lib/supabaseClient', () => ({
  supabase: fake.supabase,
  isSupabaseConfigured: true,
  mockAuthEnabled: false,
}));

const { AuthProvider, useAuth } = await import('./AuthContext');

const ANA = { id: 'uuid-ana', email: 'ana@centum.mx' };
const ANA_PROFILE = { full_name: 'Ana García', role: 'student' };

function Probe() {
  const { user, error, isInitializing, login, logout } = useAuth();
  if (isInitializing) return <p>cargando</p>;
  return (
    <div>
      <p data-testid="user">{user ? `${user.name}|${user.role}` : 'anon'}</p>
      <p data-testid="error">{error}</p>
      <button onClick={() => login('ana@centum.mx', 'secreta')}>entrar</button>
      <button onClick={() => logout()}>salir</button>
    </div>
  );
}

function renderAuth() {
  return render(<AuthProvider><Probe /></AuthProvider>);
}

beforeEach(() => {
  fake.listeners.length = 0;
  fake.supabase.auth.getSession.mockResolvedValue({ data: { session: null } });
  fake.supabase.auth.signOut.mockResolvedValue({ error: null });
  fake.maybeSingle.mockResolvedValue({ data: ANA_PROFILE, error: null });
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('AuthProvider con Supabase', () => {
  test('restaura la sesión existente al cargar', async () => {
    fake.supabase.auth.getSession.mockResolvedValue({ data: { session: { user: ANA } } });
    renderAuth();
    expect(screen.getByText('cargando')).toBeInTheDocument();
    expect(await screen.findByTestId('user')).toHaveTextContent('Ana García|student');
  });

  test('inicia sesión con credenciales válidas', async () => {
    fake.supabase.auth.signInWithPassword.mockResolvedValue({ data: { user: ANA }, error: null });
    renderAuth();
    await userEvent.click(await screen.findByText('entrar'));
    expect(screen.getByTestId('user')).toHaveTextContent('Ana García|student');
    expect(fake.supabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'ana@centum.mx',
      password: 'secreta',
    });
  });

  test('muestra error genérico con credenciales inválidas', async () => {
    fake.supabase.auth.signInWithPassword.mockResolvedValue({
      data: { user: null },
      error: { code: 'invalid_credentials' },
    });
    renderAuth();
    await userEvent.click(await screen.findByText('entrar'));
    expect(screen.getByTestId('user')).toHaveTextContent('anon');
    expect(screen.getByTestId('error')).toHaveTextContent('Correo o contraseña incorrectos');
  });

  test('cierra la sesión si la cuenta no tiene rol válido', async () => {
    fake.supabase.auth.signInWithPassword.mockResolvedValue({ data: { user: ANA }, error: null });
    fake.maybeSingle.mockResolvedValue({ data: null, error: null });
    renderAuth();
    await userEvent.click(await screen.findByText('entrar'));
    expect(fake.supabase.auth.signOut).toHaveBeenCalled();
    expect(screen.getByTestId('user')).toHaveTextContent('anon');
    expect(screen.getByTestId('error')).toHaveTextContent(/no tiene un rol asignado/i);
  });

  test('no filtra el error técnico si falla la consulta del perfil', async () => {
    fake.supabase.auth.signInWithPassword.mockResolvedValue({ data: { user: ANA }, error: null });
    fake.maybeSingle.mockResolvedValue({ data: null, error: { message: 'relation "profiles" does not exist' } });
    renderAuth();
    await userEvent.click(await screen.findByText('entrar'));
    expect(fake.supabase.auth.signOut).toHaveBeenCalled();
    expect(screen.getByTestId('error')).not.toHaveTextContent(/profiles/);
  });

  test('cerrar sesión limpia al usuario sin mostrar "sesión expirada"', async () => {
    fake.supabase.auth.getSession.mockResolvedValue({ data: { session: { user: ANA } } });
    fake.supabase.auth.signOut.mockImplementation(async () => {
      fake.listeners.forEach(cb => cb('SIGNED_OUT', null));
      return { error: null };
    });
    renderAuth();
    await screen.findByText('Ana García|student');
    await userEvent.click(screen.getByText('salir'));
    expect(screen.getByTestId('user')).toHaveTextContent('anon');
    expect(screen.getByTestId('error')).toBeEmptyDOMElement();
  });

  test('si falla la red al salir, limpia la sesión local', async () => {
    fake.supabase.auth.getSession.mockResolvedValue({ data: { session: { user: ANA } } });
    fake.supabase.auth.signOut
      .mockResolvedValueOnce({ error: { name: 'AuthRetryableFetchError' } })
      .mockResolvedValueOnce({ error: null });
    renderAuth();
    await screen.findByText('Ana García|student');
    await userEvent.click(screen.getByText('salir'));
    expect(fake.supabase.auth.signOut).toHaveBeenLastCalledWith({ scope: 'local' });
    expect(screen.getByTestId('user')).toHaveTextContent('anon');
  });

  test('avisa cuando la sesión expira sin que el usuario la cierre', async () => {
    fake.supabase.auth.getSession.mockResolvedValue({ data: { session: { user: ANA } } });
    renderAuth();
    await screen.findByText('Ana García|student');
    act(() => fake.listeners.forEach(cb => cb('SIGNED_OUT', null)));
    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('anon'));
    expect(screen.getByTestId('error')).toHaveTextContent(/sesión expiró/i);
  });
});
