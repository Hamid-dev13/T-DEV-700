import React, { useMemo, useState } from 'react'
import PageShell from '../../components/PageShell.jsx'
import { LineChartCard, BarChartCard } from '../../components/ChartCard.jsx'
import { useData } from '../../context/DataContext.jsx'
import * as api from '../../utils/api.js'

export default function TeamAverages() {
  const { teams } = useData()
  const [teamId, setTeamId] = useState(teams[0]?.id)
  const [from, setFrom] = useState(new Date(Date.now()-7*24*3600*1000).toISOString().slice(0,10))
  const [to, setTo] = useState(new Date().toISOString().slice(0,10))

  const { daily, weekly } = useMemo(()=> teamId ? api.teamAverages(teamId, from, to) : { daily: [], weekly: [] }, [teamId, from, to])

  return (
    <PageShell title="Moyennes d'équipe" description="Moyennes quotidiennes et hebdomadaires sur une période.">
      <div className="flex flex-wrap items-end gap-3 mb-4">
        <div>
          <label className="text-sm opacity-70">Équipe</label>
          <select className="input" value={teamId} onChange={e=>setTeamId(e.target.value)}>
            {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
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
        <LineChartCard title="Moyenne heures / jour" data={daily} dataKeyX="day" dataKeyY="hours" />
        <BarChartCard title="Moyenne heures / semaine" data={weekly} dataKeyX="week" dataKeyY="hours" />
      </div>
    </PageShell>
  )
}
