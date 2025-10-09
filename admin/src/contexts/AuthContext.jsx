import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Vérifier l'authentification au chargement
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('http://localhost:3001/user', {
        method: 'GET',
        credentials: 'include', // Important pour envoyer les cookies
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Vérifier que l'utilisateur est admin
        if (data.admin === true) {
          setUser(data);
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await fetch('http://localhost:3001/user/login', {
        method: 'POST',
        credentials: 'include', // Important pour recevoir les cookies
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      console.log('Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('Login response data:', data);

        // Vérifier que l'utilisateur est admin
        if (data.admin === true) {
          setUser(data);
          return { success: true };
        } else {
          return { success: false, error: 'Accès réservé aux administrateurs' };
        }
      } else {
        const errorData = await response.json();
        console.error('Login error response:', errorData);
        return { success: false, error: errorData.error || errorData.message || 'Login failed' };
      }
    } catch (error) {
      console.error('Login exception:', error);
      return { success: false, error: 'Erreur de connexion' };
    }
  };

  const logout = async () => {
    // Supprimer le cookie côté client
    document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
