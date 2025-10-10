import React from 'react'
import { Outlet } from 'react-router-dom'
import NavBar from '../../components/NavBar.jsx'

export default function EmployeeLayout() {
  return (
    <div>
      <NavBar links={[
        { to: '/employee/clock', label: 'Pointage' },
        { to: '/employee/dashboards', label: 'Tableaux de bord' },
        { to: '/employee/profile', label: 'Mon compte' },
      ]} />
      <Outlet />
    </div>
  )
}
