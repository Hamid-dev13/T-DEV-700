import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { login as apiLogin, getCurrentUser, getUserTeams } from '../services/api';
import type { User } from '../types';

// Types pour le contexte
interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  isManager: boolean;
  login: (email: string, password: string) => Promise<LoginResult>;
  logout: () => void;
  isAuthenticated: boolean;
}

interface LoginResult {
  success: boolean;
  error?: string;
}

interface AuthProviderProps {
  children: ReactNode;
}

// Création du contexte
const AuthContext = createContext<AuthContextType | null>(null);

// Hook personnalisé pour utiliser le contexte
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider');
  }
  return context;
};

// Provider
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isManager, setIsManager] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const userData = await getCurrentUser();
      
      // Vérifie si l'utilisateur est manager
      const teams = await getUserTeams();
      const isUserManager = teams.some(teamData => teamData.team.managerId === userData.id);
      
      // Met à jour tout en une seule fois
      setUser(userData);
      setIsManager(isUserManager);
    } catch (err) {
      setUser(null);
      setIsManager(false);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<LoginResult> => {
    try {
      setError(null);
      const userData = await apiLogin(email, password);
      
      // Vérifie le rôle après la connexion
      const teams = await getUserTeams();
      const isUserManager = teams.some(teamData => teamData.team.managerId === userData.id);
      
      // Met à jour tout en une seule fois
      setUser(userData as User);
      setIsManager(isUserManager);
      
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur de connexion';
      setError(message);
      return { success: false, error: message };
    }
  };

  const logout = () => {
    setUser(null);
    setIsManager(false);
  };

  const value: AuthContextType = {
    user,
    loading,
    error,
    isManager,
    login,
    logout,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};