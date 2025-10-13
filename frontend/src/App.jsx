// src/App.jsx
import React from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext.jsx'
import { DataProvider } from './context/DataContext.jsx'

import Login from './pages/Login.jsx'
import EmployeeLayout from './pages/employee/EmployeeLayout.jsx'
import EmployeeHome from './pages/employee/EmployeeHome.jsx'
import EmployeeProfile from './pages/employee/EmployeeProfile.jsx'
import EmployeeClock from './pages/employee/EmployeeClock.jsx'
import EmployeeDashboards from './pages/employee/EmployeeDashboards.jsx'
import ManagerLayout from './pages/manager/ManagerLayout.jsx'
import ManagerHome from './pages/manager/ManagerHome.jsx'
import ManagerClock from './pages/manager/ManagerClock.jsx'
import TeamAverages from './pages/manager/TeamAverages.jsx'
import CollaboratorHours from './pages/manager/CollaboratorHours.jsx'
import CollaboratorDashboards from './pages/manager/CollaboratorDashboards.jsx'

function LoadingScreen() {
  return <div className="min-h-screen flex items-center justify-center"><div className="opacity-70">Chargement…</div></div>
}

function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />
  if (roles && !roles.includes(user.role)) return <RoleRedirect />
  return children
}
function RoleRedirect() {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/login" replace />
  return <Navigate to={user.role === 'manager' ? '/manager/clock' : '/employee/clock'} replace />
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<RoleRedirect />} />

      <Route
        path="/employee"
        element={
          <ProtectedRoute roles={['employee','manager']}>
            <DataProvider><EmployeeLayout /></DataProvider>
          </ProtectedRoute>
        }
      >
        <Route index element={<EmployeeHome />} />
        <Route path="clock" element={<EmployeeClock />} />
        <Route path="dashboards" element={<EmployeeDashboards />} />
        <Route path="profile" element={<EmployeeProfile />} />
      </Route>

      <Route
        path="/manager"
        element={
          <ProtectedRoute roles={['manager']}>
            <DataProvider><ManagerLayout /></DataProvider>
          </ProtectedRoute>
        }
      >
        <Route index element={<ManagerHome />} />
        <Route path="clock" element={<ManagerClock />} />
        <Route path="team-averages" element={<TeamAverages />} />
        <Route path="collaborator-hours" element={<CollaboratorHours />} />
        <Route path="dashboards" element={<CollaboratorDashboards />} />
      </Route>

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
