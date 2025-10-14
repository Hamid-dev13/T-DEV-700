/**
 * @file App.jsx
 * @brief Fichier généré avec des commentaires explicatifs (auto-documentation).
 * @note Ces commentaires sont des points de départ : ajustez la description métier si nécessaire.
 */

// src/App.jsx
import React from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext.jsx'
import Login from './pages/Login.jsx'
import AccountPage from './pages/AccountPage.jsx'
import ClockPage from './pages/ClockPage.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import TeamManagePage from './pages/TeamManagePage.jsx'

/**
 * Composant React principal.

 * @returns {any} Valeur de retour.
 */

function LoadingScreen() {
  return <div className="min-h-screen flex items-center justify-center"><div className="opacity-70">Chargement…</div></div>
}

/**
 * Composant React principal.
 * @param {{any}} { children - Description du paramètre.
 * @param {{any}} roles } - Description du paramètre.
 * @returns {any} Valeur de retour.
 */

function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />
  if (roles && !roles.includes(user.role)) return <RoleRedirect />
  return children
}
/**
 * Composant React principal.

 * @returns {any} Valeur de retour.
 */
function RoleRedirect() {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/login" replace />
  return <Navigate to='/clock' replace />
}

/**
 * Composant React principal.

 * @returns {any} Valeur de retour.
 */

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<RoleRedirect />} />
      <Route path="/account" element={<AccountPage />} />
      <Route path="/clock" element={<ClockPage />} />
      <Route path="/dashboards" element={<DashboardPage />} />
      <Route path="/team" element={<TeamManagePage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

/**
 * Composant React principal.

 * @returns {any} Valeur de retour.
 * @default Export par défaut.
 */

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}
