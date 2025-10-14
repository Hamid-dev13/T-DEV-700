import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import EmployeePage from './pages/EmployeePage';

// Composant pour protéger les routes
const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-[#FFD700] border-t-transparent rounded-full animate-spin"></div>
          <div className="text-[#FFD700] text-xl font-semibold">
            Chargement...
          </div>
        </div>
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

// Composant pour rediriger si déjà connecté
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-[#FFD700] border-t-transparent rounded-full animate-spin"></div>
          <div className="text-[#FFD700] text-xl font-semibold">
            Chargement...
          </div>
        </div>
      </div>
    );
  }

  return !isAuthenticated ? <>{children}</> : <Navigate to="/employee" replace />;
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Route publique */}
          <Route 
            path="/login" 
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            } 
          />

          {/* Route protégée */}
          <Route 
            path="/employee" 
            element={
              <PrivateRoute>
                <EmployeePage />
              </PrivateRoute>
            } 
          />

          {/* Redirection par défaut */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;