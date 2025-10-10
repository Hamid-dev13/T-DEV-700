import React, { useMemo, useState } from 'react'
import { Shell, Card } from '../components/Layout'
import { employeesOnly, computeDailyHoursForUser } from '../auth'

function iso(d){ return d.toISOString().slice(0,10) }

export default function CollabTimesPage({ backTo='/manager' }) {
  const emps = employeesOnly()
  const [userId, setUserId] = useState(emps[0]?.id || '')
  const [start, setStart] = useState(iso(new Date(Date.now()-7*864e5)))
  const [end, setEnd] = useState(iso(new Date()))
  const data = useMemo(()=> userId ? computeDailyHoursForUser(userId, start, end) : [], [userId, start, end])

  return (
    <Shell>
      <div className="login-wrap">
        <Card title="Heures par collaborateur">
          <div className="grid-3 mb-3">
            <select className="input" value={userId} onChange={e=>setUserId(e.target.value)}>
              {emps.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
            <input className="input" type="date" value={start} onChange={e=>setStart(e.target.value)} />
            <input className="input" type="date" value={end} onChange={e=>setEnd(e.target.value)} />
          </div>
          <table className="table">
            <thead><tr><th>Jour</th><th>Heures</th></tr></thead>
            <tbody>{data.map(r => (<tr key={r.day}><td>{r.day}</td><td>{r.hours.toFixed(2)}</td></tr>))}</tbody>
          </table>
        </Card>
      </div>
    </Shell>
  )
}