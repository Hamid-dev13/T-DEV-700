import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import EmployeePage from './pages/EmployeePage';
import ManagerPage from './pages/ManagerPage';

// Composant pour protéger les routes
const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-black text-xl font-semibold animate-pulse">
          Chargement...
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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-black text-xl font-semibold animate-pulse">
          Chargement...
        </div>
      </div>
    );
  }

  return !isAuthenticated ? <>{children}</> : <Navigate to="/dashboard" replace />;
};

// Composant pour rediriger vers la bonne page selon le rôle
const DashboardRedirect: React.FC = () => {
  const { isManager } = useAuth();
  return <Navigate to={isManager ? "/manager" : "/employee"} replace />;
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

          {/* Redirection automatique selon le rôle */}
          <Route 
            path="/dashboard" 
            element={
              <PrivateRoute>
                <DashboardRedirect />
              </PrivateRoute>
            } 
          />

          {/* Route Employé */}
          <Route 
            path="/employee" 
            element={
              <PrivateRoute>
                <EmployeePage />
              </PrivateRoute>
            } 
          />

          {/* Route Manager */}
          <Route 
            path="/manager" 
            element={
              <PrivateRoute>
                <ManagerPage />
              </PrivateRoute>
            } 
          />

          {/* Redirection par défaut */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;