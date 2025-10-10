import React, { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { useHashLocation } from './router'
import { currentUser } from './auth'

import Login from './pages/Login.jsx'
import Home from './pages/Home.jsx'
import EmployeeHome from './pages/EmployeeHome.jsx'
import ManagerHome from './pages/ManagerHome.jsx'
import AccountPage from './pages/AccountPage.jsx'
import DeletePage from './pages/DeletePage.jsx'
import PunchPage from './pages/PunchPage.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import HoursPage from './pages/HoursPage.jsx'
import TeamAveragesPage from './pages/TeamAveragesPage.jsx'
import TeamManagePage from './pages/TeamManagePage.jsx'
import CollabTimesPage from './pages/CollabTimesPage.jsx'
import CollabDashboardsPage from './pages/CollabDashboardsPage.jsx'

function App() {
  useEffect(() => { try { seedUsers() } catch(e) {} try { seedTeams() } catch(e) {} }, [])
  const [path, setPath] = useState(location.hash.slice(1) || '/login')
  useEffect(() => useHashLocation(setPath), [])
  const me = currentUser()

  switch (path) {
    case '/login': return <Login />
    case '/home': return <Home />
    case '/employee': return <EmployeeHome />
    case '/employee/account': return <AccountPage backTo="/employee" />
    case '/employee/delete': return <DeletePage backTo="/employee" />
    case '/employee/punch': return <PunchPage backTo="/employee" />
    case '/employee/dashboard': return <DashboardPage backTo="/employee" />
    case '/employee/hours': return <HoursPage backTo="/employee" />
    case '/manager': return <ManagerHome />
    case '/manager/account': return <AccountPage backTo="/manager" />
    case '/manager/delete': return <DeletePage backTo="/manager" />
    case '/manager/punch': return <PunchPage backTo="/manager" />
    case '/manager/dashboard': return <DashboardPage backTo="/manager" />
    case '/manager/hours': return <HoursPage backTo="/manager" />
    case '/manager/team-averages': return <TeamAveragesPage backTo="/manager" />
    case '/manager/team': return <TeamManagePage backTo="/manager" />
    case '/manager/collab-times': return <CollabTimesPage backTo="/manager" />
    case '/manager/collab-dashboards': return <DashboardPage backTo="/manager" />
    default: return <Login />
  }
}
createRoot(document.getElementById('root')).render(<App />)