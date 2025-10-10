import React from 'react'
import PageShell from '../../components/PageShell.jsx'
import { useData } from '../../context/DataContext.jsx'
import * as api from '../../utils/fakeApi.js'
import { LineChartCard } from '../../components/ChartCard.jsx'

export default function CollaboratorDashboards() {
  const { users, clocks } = useData()
  const employees = users.filter(u => u.role === 'employee')

  return (
    <PageShell title="Dashboards collaborateurs" description="Un aperçu rapide des heures récentes.">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {employees.map(u => {
          const daily = api.computeDailyHours(clocks.filter(c => c.userId === u.id)).slice(-7)
          return (
            <div key={u.id} className="space-y-2">
              <div className="font-semibold">{u.firstName} {u.lastName}</div>
              <LineChartCard title="7 derniers jours" data={daily} dataKeyX="day" dataKeyY="hours" />
            </div>
          )
        })}
      </div>
    </PageShell>
  )
}
