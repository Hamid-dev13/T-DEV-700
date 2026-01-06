import React, { createContext, useContext, useEffect, useMemo, useState, ReactNode, useCallback } from 'react'
import { User } from '../utils/types'
import * as api from '../utils/api'

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>,
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Vérifier l'authentification au chargement
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const u = await api.getSession();
      setUser(u && u.admin === true ? u : null);
    } catch (error) {
      console.error('Auth check failed:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const u = await api.login(email, password);

      if (u) {
        if (u.admin === true) {
          setUser(u);
          return { success: true };
        } else {
          return { success: false, error: 'Accès réservé aux administrateurs' };
        }
      } else {
        return { success: false, error: 'Erreur de connexion' };
      }
    } catch (error: any) {
      console.error('Login exception:', error);
      return { success: false, error: error.message || 'Erreur de connexion' };
    }
  };

  const logout = async () => {
    setLoading(true)
    try {
      await api.logout()
      setUser(null)
    } finally {
      setLoading(false)
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}