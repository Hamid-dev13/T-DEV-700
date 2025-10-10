import React from 'react'
import PageShell from '../../components/PageShell.jsx'
import Stat from '../../components/Stat.jsx'
import { useData } from '../../context/DataContext.jsx'

export default function ManagerHome() {
  const { users, teams } = useData()
  const employees = users.filter(u => u.role === 'employee')
  return (
    <PageShell title="Tableau de bord Manager" description="Aperçu de votre équipe.">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Stat label="Employés" value={employees.length} />
        <Stat label="Équipes" value={teams.length} />
        <Stat label="Membres / équipe" value={(employees.length / (teams.length || 1)).toFixed(1)} />
      </div>
    </PageShell>
  )
}
