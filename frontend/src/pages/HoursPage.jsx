import React, { useMemo, useState } from 'react'
import { Shell, Card } from '../components/Layout'
import { currentUser, employeesOnly, computeDailyHoursForUser } from '../auth'

function iso(d){ return d.toISOString().slice(0,10) }

export default function HoursPage({ backTo='/home' }) {
  const me = currentUser()
  const isManager = me?.role === 'manager'
  // common date range
  const [start, setStart] = useState(iso(new Date(Date.now()-7*864e5)))
  const [end, setEnd] = useState(iso(new Date()))

  // personal
  const myData = useMemo(()=> me ? computeDailyHoursForUser(me.id, start, end) : [], [me, start, end])

  // collaborator (manager only)
  const emps = employeesOnly()
  const [userId, setUserId] = useState(emps[0]?.id || '')
  const collabData = useMemo(()=> (isManager && userId) ? computeDailyHoursForUser(userId, start, end) : [], [isManager, userId, start, end])

  if (!isManager) {
    // Employee: only personal table
    return (
      <Shell>
        <div className="login-wrap">
          <Card title="Mes heures (quotidien)">
            <div className="flex gap-2 mb-3">
              <input className="input" type="date" value={start} onChange={e=>setStart(e.target.value)} />
              <input className="input" type="date" value={end} onChange={e=>setEnd(e.target.value)} />
            </div>
            <table className="table">
              <thead><tr><th>Jour</th><th>Heures</th></tr></thead>
              <tbody>
                {myData.map(r => (<tr key={r.day}><td>{r.day}</td><td>{r.hours.toFixed(2)}</td></tr>))}
              </tbody>
            </table>
          </Card>
        </div>
      </Shell>
    )
  }

  // Manager: tabs: "Mes heures" and "Collaborateur"
  const [tab, setTab] = useState('me')

  return (
    <Shell>
      <div className="login-wrap">
        <div className="surface p-2 mb-4 inline-flex rounded-full">
          <button className={"nav-pill" + (tab==='me' ? " nav-pill-active" : "")} onClick={()=>setTab('me')}>Mes heures</button>
          <button className={"nav-pill ml-2" + (tab==='collab' ? " nav-pill-active" : "")} onClick={()=>setTab('collab')}>Collaborateur</button>
        </div>

        {tab === 'me' ? (
          <Card title="Mes heures (quotidien)">
            <div className="flex gap-2 mb-3">
              <input className="input" type="date" value={start} onChange={e=>setStart(e.target.value)} />
              <input className="input" type="date" value={end} onChange={e=>setEnd(e.target.value)} />
            </div>
            <table className="table">
              <thead><tr><th>Jour</th><th>Heures</th></tr></thead>
              <tbody>
                {myData.map(r => (<tr key={r.day}><td>{r.day}</td><td>{r.hours.toFixed(2)}</td></tr>))}
              </tbody>
            </table>
          </Card>
        ) : (
          <Card title="Heures par collaborateur (quotidien)">
            <div className="grid-3 mb-3">
              <select className="input" value={userId} onChange={e=>setUserId(e.target.value)}>
                {emps.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
              <input className="input" type="date" value={start} onChange={e=>setStart(e.target.value)} />
              <input className="input" type="date" value={end} onChange={e=>setEnd(e.target.value)} />
            </div>
            <table className="table">
              <thead><tr><th>Jour</th><th>Heures</th></tr></thead>
              <tbody>{collabData.map(r => (<tr key={r.day}><td>{r.day}</td><td>{r.hours.toFixed(2)}</td></tr>))}</tbody>
            </table>
          </Card>
        )}
      </div>
    </Shell>
  )
}