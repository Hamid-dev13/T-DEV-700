import React, { ReactNode } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Login from './pages/Login'
import AccountPage from './pages/AccountPage'
import ClockPage from './pages/ClockPage'
import DashboardPage from './pages/DashboardPage'
import TeamManagePage from './pages/TeamManagePage'
import MemberDetailsPage from './pages/MemberDetailsPage'

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="opacity-70">Chargement…</div>
    </div>
  )
}

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />
  return <>{children}</>
}

function RoleRedirect() {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to={{pathname:"/login"}} />
  return <Navigate to={{pathname:"/clock"}} />
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<RoleRedirect />} />
      <Route path="/account" element={<AccountPage />} />
      <Route path="/clock" element={<ClockPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/team" element={<TeamManagePage />} />
      <Route path="/member/:memberId" element={<MemberDetailsPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}
