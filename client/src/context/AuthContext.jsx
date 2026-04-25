import { createContext, useContext, useMemo, useState } from 'react';

const STORAGE_KEY = 'smart-campus-auth';

const AuthContext = createContext(null);

function getStoredAuth() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => getStoredAuth());

  const signIn = (authResponse) => {
    setAuth(authResponse);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(authResponse));
  };

  const signOut = () => {
    setAuth(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const value = useMemo(
    () => ({
      auth,
      token: auth?.token ?? null,
      role: auth?.role ?? null,
      name: auth?.name ?? null,
      isAuthenticated: Boolean(auth?.token),
      signIn,
      signOut,
    }),
    [auth],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
