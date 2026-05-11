'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, getCurrentUser, logoutUser, getAccessToken } from './api';
import { isTokenValid } from './tokenSecurity';

interface AuthContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Загружаем пользователя из localStorage при монтировании
    const savedUser = getCurrentUser();
    const token = getAccessToken();

    // Если токен истёк — принудительный выход (не ждём 401 от сервера)
    if (savedUser && token && !isTokenValid(token)) {
      void logoutUser();
      setUser(null);
    } else {
      setUser(savedUser);
    }

    setIsLoading(false);
  }, []);

  const logout = async () => {
    await logoutUser();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
