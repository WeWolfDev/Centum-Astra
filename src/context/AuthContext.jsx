import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { mockUsers } from '../data/mockData';
import { supabase, isSupabaseConfigured, mockAuthEnabled } from '../lib/supabaseClient';
import { authErrorMessage, toAppUser } from '../lib/authService';

const AuthContext = createContext(null);

const NO_ROLE_ERROR = 'Tu cuenta no tiene un rol asignado. Contacta al administrador.';
const SESSION_EXPIRED_ERROR = 'Tu sesión expiró. Inicia sesión de nuevo.';
const AUTH_UNAVAILABLE_ERROR = 'El inicio de sesión no está disponible por ahora.';

// TODO(#26): ajustar tabla/columnas cuando el modelo de datos esté definido.
async function fetchAppUser(authUser) {
  const { data, error } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', authUser.id)
    .maybeSingle();
  if (error) throw error;
  return toAppUser(authUser, data);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');
  const [isInitializing, setIsInitializing] = useState(isSupabaseConfigured);
  // Distingue un cierre de sesión pedido por el usuario de una expiración.
  const isSigningOut = useRef(false);
  const userRef = useRef(null);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    if (!isSupabaseConfigured) return undefined;
    let isActive = true;

    async function restoreSession(session) {
      try {
        const appUser = session ? await fetchAppUser(session.user) : null;
        if (isActive) setUser(appUser);
      } catch {
        if (isActive) setUser(null);
      } finally {
        if (isActive) setIsInitializing(false);
      }
    }

    supabase.auth.getSession().then(({ data }) => restoreSession(data.session));

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event !== 'SIGNED_OUT' || !isActive) return;
      if (userRef.current && !isSigningOut.current) setError(SESSION_EXPIRED_ERROR);
      isSigningOut.current = false;
      setUser(null);
    });

    return () => {
      isActive = false;
      subscription.unsubscribe();
    };
  }, []);

  async function loginWithSupabase(email, password) {
    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      setError(authErrorMessage(signInError));
      return false;
    }
    try {
      const appUser = await fetchAppUser(data.user);
      if (!appUser) {
        isSigningOut.current = true;
        await supabase.auth.signOut();
        setError(NO_ROLE_ERROR);
        return false;
      }
      setUser(appUser);
      setError('');
      return true;
    } catch (profileError) {
      isSigningOut.current = true;
      await supabase.auth.signOut();
      setError(authErrorMessage(profileError));
      return false;
    }
  }

  function loginWithMock(email, password) {
    const found = mockUsers.find(u => u.email === email && u.password === password);
    if (found) {
      setUser(found);
      setError('');
      return true;
    }
    setError('Correo o contraseña incorrectos');
    return false;
  }

  async function login(email, password) {
    if (isSupabaseConfigured) return loginWithSupabase(email, password);
    if (mockAuthEnabled) return loginWithMock(email, password);
    setError(AUTH_UNAVAILABLE_ERROR);
    return false;
  }

  async function logout() {
    if (isSupabaseConfigured) {
      isSigningOut.current = true;
      // Si la red falla, igual se limpia la sesión local para no dejar al usuario dentro.
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) await supabase.auth.signOut({ scope: 'local' });
    }
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, error, setError, isInitializing }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
