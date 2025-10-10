import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
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

function PrivateRoute({ children, role }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (role && user.role !== role) return <Navigate to="/" replace />
  return children
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<Login />} />

      <Route path="/employee" element={
        <PrivateRoute role="employee">
          <EmployeeLayout />
        </PrivateRoute>
      }>
        <Route index element={<Navigate to="/employee/clock" replace />} />
        <Route path="profile" element={<EmployeeProfile />} />
        <Route path="clock" element={<EmployeeClock />} />
        <Route path="dashboards" element={<EmployeeDashboards />} />
        <Route path="home" element={<EmployeeHome />} />
      </Route>

      <Route path="/manager" element={
        <PrivateRoute role="manager">
          <ManagerLayout />
        </PrivateRoute>
      }>
        <Route index element={<Navigate to="/manager/clock" replace />} />
        <Route path="clock" element={<ManagerClock />} />
        <Route path="team-averages" element={<TeamAverages />} />
        <Route path="collaborator-hours" element={<CollaboratorHours />} />
        <Route path="collaborator-dashboards" element={<CollaboratorDashboards />} />
        <Route path="home" element={<ManagerHome />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function RootRedirect() {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  return <Navigate to={user.role === 'manager' ? '/manager/clock' : '/employee/clock'} replace />
}

export default function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <AppRoutes />
      </DataProvider>
    </AuthProvider>
  )
}
