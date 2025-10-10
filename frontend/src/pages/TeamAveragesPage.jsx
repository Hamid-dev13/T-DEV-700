import React, { useMemo, useState } from 'react'
import { Shell, Card } from '../components/Layout'
import { averageDailyHoursForTeam } from '../auth'

function iso(d){ return d.toISOString().slice(0,10) }

export default function TeamAveragesPage({ backTo='/manager' }) {
  const [start, setStart] = useState(iso(new Date(Date.now()-7*864e5)))
  const [end, setEnd] = useState(iso(new Date()))
  const data = useMemo(()=> averageDailyHoursForTeam(start, end), [start, end])

  return (
    <Shell>
      <div className="login-wrap">
        <Card title="Moyennes des heures (équipe)">
          <div className="flex gap-2 mb-3">
            <input className="input" type="date" value={start} onChange={e=>setStart(e.target.value)} />
            <input className="input" type="date" value={end} onChange={e=>setEnd(e.target.value)} />
          </div>
          <table className="table">
            <thead><tr><th>Jour</th><th>Moyenne h</th></tr></thead>
            <tbody>
              {data.map(r => (<tr key={r.day}><td>{r.day}</td><td>{r.avg.toFixed(2)}</td></tr>))}
            </tbody>
          </table>
        </Card>
      </div>
    </Shell>
  )
}