import React, { useMemo, useState } from 'react'
import PageShell from '../../components/PageShell.jsx'
import { LineChartCard, BarChartCard } from '../../components/ChartCard.jsx'
import { useData } from '../../context/DataContext.jsx'
import * as api from '../../utils/fakeApi.js'

export default function CollaboratorHours() {
  const { users } = useData()
  const employees = users.filter(u => u.role === 'employee')
  const [userId, setUserId] = useState(employees[0]?.id)
  const [from, setFrom] = useState(new Date(Date.now()-7*24*3600*1000).toISOString().slice(0,10))
  const [to, setTo] = useState(new Date().toISOString().slice(0,10))

  const events = useMemo(()=> userId ? api.getUserClocks(userId, from, to) : [], [userId, from, to])
  const daily = useMemo(()=> api.computeDailyHours(events), [events])
  const weekly = useMemo(()=> api.aggregateWeekly(daily), [daily])

  return (
    <PageShell title="Heures d'un collaborateur" description="Vue quotidienne et hebdomadaire sur une période.">
      <div className="flex flex-wrap items-end gap-3 mb-4">
        <div>
          <label className="text-sm opacity-70">Collaborateur</label>
          <select className="input" value={userId} onChange={e=>setUserId(e.target.value)}>
            {employees.map(u => <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>)}
          </select>
        </div>
        <div>
          <label className="text-sm opacity-70">Du</label>
          <input type="date" className="input" value={from} onChange={e=>setFrom(e.target.value)} />
        </div>
        <div>
          <label className="text-sm opacity-70">Au</label>
          <input type="date" className="input" value={to} onChange={e=>setTo(e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <LineChartCard title="Heures par jour" data={daily} dataKeyX="day" dataKeyY="hours" />
        <BarChartCard title="Heures par semaine" data={weekly} dataKeyX="week" dataKeyY="hours" />
      </div>
    </PageShell>
  )
}
