import React from 'react'
import { Outlet } from 'react-router-dom'
import NavBar from '../../components/NavBar.jsx'

export default function ManagerLayout() {
  return (
    <div>
      <NavBar links={[
        { to: '/manager/clock', label: 'Pointage' },
        { to: '/manager/team-averages', label: 'Moyennes d\'équipe' },
        { to: '/manager/collaborator-hours', label: 'Heures collaborateur' },
        { to: '/manager/collaborator-dashboards', label: 'Dashboards collaborateurs' },
      ]} />
      <Outlet />
    </div>
  )
}
