import React, { useMemo, useState } from 'react'
import { Shell, Card } from '../components/Layout'
import { employeesOnly, entriesForUser, averageDailyHoursForTeam } from '../auth'

function iso(d){ return d.toISOString().slice(0,10) }

export default function CollabDashboardsPage({ backTo='/manager' }) {
  const emps = employeesOnly()
  const [start, setStart] = useState(iso(new Date(Date.now()-7*864e5)))
  const [end, setEnd] = useState(iso(new Date()))
  const averages = useMemo(()=> averageDailyHoursForTeam(start, end), [start, end])

  return (
    <Shell>
      <div className="login-wrap">
        <Card title="Moyennes de l'équipe (période)">
          <div className="flex gap-2 mb-3">
            <input className="input" type="date" value={start} onChange={e=>setStart(e.target.value)} />
            <input className="input" type="date" value={end} onChange={e=>setEnd(e.target.value)} />
          </div>
          <table className="table">
            <thead><tr><th>Jour</th><th>Moyenne (h)</th></tr></thead>
            <tbody>
              {averages.map(r => (<tr key={r.day}><td>{r.day}</td><td>{r.avg.toFixed(2)}</td></tr>))}
            </tbody>
          </table>
        </Card>

        <div className="grid-2 mt-6">
          {emps.map(u => (
            <Card key={u.id} title={"Dashboard — " + u.name}>
              <p className="subtle mb-2">Entrées récentes:</p>
              <ul className="list-disc pl-5">
                {entriesForUser(u.id).slice(0,6).map(e => (
                  <li key={e.id}>{e.kind} – {new Date(e.time).toLocaleString()}</li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      </div>
    </Shell>
  )
}