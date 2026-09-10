import { createContext, useContext, useState } from 'react';
import { mockUsers } from '../data/mockData';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');

  function login(email, password) {
    const found = mockUsers.find(u => u.email === email && u.password === password);
    if (found) {
      setUser(found);
      setError('');
      return true;
    }
    setError('Correo o contraseña incorrectos');
    return false;
  }

  function logout() {
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, error, setError }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
