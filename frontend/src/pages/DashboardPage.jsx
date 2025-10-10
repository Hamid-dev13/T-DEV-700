import React, { useMemo, useState } from 'react'
import { Shell, Card } from '../components/Layout'
import { currentUser, entriesForUser, computeDailyHoursForUser, employeesOnly, averageDailyHoursForTeam } from '../auth'

function iso(d){ return d.toISOString().slice(0,10) }
function startOfWeek(d){
  const x = new Date(d); const day = x.getDay() || 7; x.setHours(0,0,0,0); x.setDate(x.getDate() - (day-1)); return x
}
function rangeDays(n, endDate=new Date()){
  const arr=[]; for(let i=n-1;i>=0;i--){ const d=new Date(endDate); d.setDate(d.getDate()-i); arr.push(iso(d)); } return arr
}

/** Enhanced Bar Chart (axes, gridlines, value labels) */
function BarChart({ data, height=100, maxY, showValues=true }){
  const values = data.map(d => d.value)
  const max = maxY || Math.max(1, ...values) * 1.2
  const bw = 100 / Math.max(1, data.length)
  const top = 14, left = 6, bottom = 16, right = 4
  const H = height
  return (
    <svg viewBox={`0 0 100 ${H}`} className="w-full" role="img" aria-label="Bar chart">
      {/* gridlines */}
      {[0.25,0.5,0.75,1].map((g,i)=>{
        const y = top + (H - top - bottom) * g
        return <line key={'g'+i} x1={left} y1={y} x2={100-right} y2={y} stroke="rgba(0,0,0,.08)" strokeWidth="0.6" />
      })}
      {/* x-axis baseline */}
      <line x1={left} y1={H-bottom} x2={100-right} y2={H-bottom} stroke="rgba(0,0,0,.25)" strokeWidth="0.8" />
      {data.map((d,i)=>{
        const h = (d.value / max) * (H - top - bottom)
        const x = left + i*bw + 2
        const y = (H - bottom) - h
        return (
          <g key={d.label}>
            <rect x={x} y={y} width={bw-4} height={Math.max(0,h)} rx="3"
              fill="hsl(var(--accent))" stroke="#111" strokeWidth="0.6" />
            {showValues && h>6 ? (
              <text x={x + (bw-4)/2} y={y-2} fontSize="4" textAnchor="middle" fill="#111" fontWeight="700">
                {Number.isFinite(d.value) ? d.value.toFixed(1) : d.value}
              </text>
            ) : null}
            <text x={x + (bw-4)/2} y={H-4} fontSize="3.4" textAnchor="middle" fill="#333">
              {d.label.slice(5)}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

/** Enhanced Line Chart (grid, baseline, area) */
function LineChart({ points, height=100 }){
  const max = Math.max(1, ...points.map(p=>p.y)) * 1.2
  const step = 100 / Math.max(1, points.length-1)
  const top = 14, left = 6, bottom = 16, right = 4
  const H = height
  const path = points.map((p,i)=> {
    const x = left + i*step
    const y = (H - bottom) - (p.y/max)*(H - top - bottom)
    return `${i===0?'M':'L'} ${x} ${y}`
  }).join(' ')
  const area = path + ` L ${100-right} ${H-bottom} L ${left} ${H-bottom} Z`
  return (
    <svg viewBox={`0 0 100 ${H}`} className="w-full" role="img" aria-label="Line chart">
      {[0.25,0.5,0.75,1].map((g,i)=>{
        const y = top + (H - top - bottom) * g
        return <line key={'g'+i} x1={left} y1={y} x2={100-right} y2={y} stroke="rgba(0,0,0,.08)" strokeWidth="0.6" />
      })}
      <line x1={left} y1={H-bottom} x2={100-right} y2={H-bottom} stroke="rgba(0,0,0,.25)" strokeWidth="0.8" />
      <path d={area} fill="rgba(255, 212, 0, .20)" stroke="none" />
      <path d={path} fill="none" strokeWidth="2" stroke="hsl(var(--accent))" />
      {points.map((p,i)=>{
        const x = left + i*step
        const y = (H - bottom) - (p.y/max)*(H - top - bottom)
        return <circle key={'c'+i} cx={x} cy={y} r="2.2" fill="#111" stroke="hsl(var(--accent))" strokeWidth="1" />
      })}
      {points.map((p,i)=> (
        <text key={'t'+i} x={left + i*step} y={H-4} fontSize="3.4" textAnchor="middle" fill="#333">{(p.x||'').toString().slice(5)}</text>
      ))}
    </svg>
  )
}

export default function DashboardPage({ backTo='/home' }){
  const me = currentUser()
  const now = new Date()

  // EMPLOYEE VIEW
  const empData = useMemo(()=>{
    if (!me) return null
    const last7Days = rangeDays(7, now)
    const perDay = computeDailyHoursForUser(me.id, last7Days[0], last7Days[last7Days.length-1])
    const map = new Map(perDay.map(d => [d.day, d.hours]))
    const bars = last7Days.map(day => ({ label: day, value: +(map.get(day)||0).toFixed(2) }))

    const todayISO = iso(now)
    const todays = perDay.find(d => d.day === todayISO)?.hours || 0
    const sw = startOfWeek(now)
    const perWeek = computeDailyHoursForUser(me.id, iso(sw), todayISO)
    const weekTotal = perWeek.reduce((a,b)=> a + (b.hours||0), 0)
    const pct7h = (bars.filter(b => b.value >= 7).length / bars.length) * 100

    const all = entriesForUser(me.id)
    const last = all[0] ? all[0] : (all.length ? all[all.length-1] : null)
    const lastTime = last ? new Date(last.time) : null

    return { bars, todays, weekTotal, pct7h, lastTime }
  }, [me])

  return (
    <Shell>
      <div className="login-wrap">
        {me?.role !== 'manager' ? (
          <div className="grid-2">
            <Card title="Résumé rapide">
              <div className="grid-3">
                <div><div className="subtle">Heures aujourd'hui</div><div className="text-2xl font-semibold">{empData?.todays?.toFixed(2) || '0.00'} h</div></div>
                <div><div className="subtle">Total semaine</div><div className="text-2xl font-semibold">{empData?.weekTotal?.toFixed(2) || '0.00'} h</div></div>
                <div><div className="subtle">% jours ≥ 7h (7j)</div><div className="text-2xl font-semibold">{empData ? Math.round(empData.pct7h) : 0}%</div></div>
              </div>
              <div className="mt-3 subtle">Dernier pointage: {empData?.lastTime ? empData.lastTime.toLocaleString() : '—'}</div>
            </Card>
            <Card title="Mes 7 derniers jours">
              <BarChart data={empData?.bars || []} height={110} />
            </Card>
          </div>
        ) : (
          <ManagerDashboard />
        )}
      </div>
    </Shell>
  )
}

function ManagerDashboard(){
  const now = new Date()
  const emps = employeesOnly()
  const [selectedEmp, setSelectedEmp] = useState(emps[0]?.id || '')

  const last7Days = rangeDays(7, now)
  const avgSeries = averageDailyHoursForTeam(last7Days[0], last7Days[last7Days.length-1])
  const linePoints = last7Days.map(d => ({ x: d, y: +(avgSeries.find(x=>x.day===d)?.avg || 0).toFixed(2) }))
  const teamAvg = linePoints.reduce((a,b)=> a + b.y, 0) / (linePoints.length||1)
  let teamTotal = 0
  const top = []
  for (const u of emps){
    const perDay = computeDailyHoursForUser(u.id, last7Days[0], last7Days[last7Days.length-1])
    const total = perDay.reduce((a,b)=> a + (b.hours||0), 0)
    teamTotal += total
    top.push({ id: u.id, name: u.name, total: +total.toFixed(2) })
  }
  top.sort((a,b)=> b.total - a.total)

  const empPerDay = computeDailyHoursForUser(selectedEmp, last7Days[0], last7Days[last7Days.length-1])
  const empMap = new Map(empPerDay.map(d => [d.day, d.hours]))
  const empBars = last7Days.map(day => ({ label: day, value: +(empMap.get(day)||0).toFixed(2) }))
  const total7 = empPerDay.reduce((a,b)=> a + (b.hours||0), 0)
  const pct7h = Math.round((empPerDay.filter(d => (d.hours||0) >= 7).length / (empPerDay.length||1)) * 100)
  const all = entriesForUser(selectedEmp)
  const last = all[0] ? all[0] : (all.length ? all[all.length-1] : null)
  const lastTime = last ? new Date(last.time) : null

  return (
    <div className="grid-3">
      <Card title="Aperçu équipe (7 jours)" className="col-span-2">
        <div className="grid-3">
          <div><div className="subtle">Collaborateurs</div><div className="text-2xl font-semibold">{emps.length}</div></div>
          <div><div className="subtle">Total heures (équipe)</div><div className="text-2xl font-semibold">{teamTotal.toFixed(2)} h</div></div>
          <div><div className="subtle">Moyenne / jour</div><div className="text-2xl font-semibold">{teamAvg.toFixed(2)} h</div></div>
        </div>
        <p className="subtle mt-2">Période : 7 derniers jours glissants.</p>
      </Card>

      <Card title="Moyenne quotidienne (équipe) — 7 jours">
        <LineChart points={linePoints.map((p,i)=>({x:i,y:p.y}))} height={110} />
        <div className="subtle">Moyenne des heures par jour pour l’équipe.</div>
      </Card>

      <Card title="Employé sélectionné — 7 jours" className="col-span-2" actions={
        <select className="input" value={selectedEmp} onChange={e=>setSelectedEmp(e.target.value)}>
          {emps.map(u => (<option key={u.id} value={u.id}>{u.name}</option>))}
        </select>
      }>
        <div className="grid-3">
          <div><div className="subtle">Total 7 jours</div><div className="text-2xl font-semibold">{total7.toFixed(2)} h</div></div>
          <div><div className="subtle">% jours ≥ 7h</div><div className="text-2xl font-semibold">{pct7h}%</div></div>
          <div><div className="subtle">Dernier pointage</div><div className="text-base">{lastTime ? lastTime.toLocaleString() : '—'}</div></div>
        </div>
        <BarChart data={empBars} height={110} />
        <div className="subtle mt-2">Heures/jour pour l’employé choisi.</div>
      </Card>

      <Card title="Top activité (7 jours)">
        <div className="card-scroll">
        <table className="table">
          <thead><tr><th>Collaborateur</th><th>Total h</th></tr></thead>
          <tbody>
            {top.slice(0,3).map(r => (<tr key={r.id}><td>{r.name}</td><td>{r.total.toFixed(2)}</td></tr>))}
          </tbody>
        </table>
        </div>
      </Card>

      <Card title="Derniers pointages" className="col-span-2">
        <div className="card-scroll">
        <ul className="list-disc pl-5">
          {emps.map(u => {
            const allU = entriesForUser(u.id)
            const lastU = allU[0] ? allU[0] : (allU.length ? allU[allU.length-1] : null)
            return <li key={u.id}><b>{u.name}:</b> {lastU ? new Date(lastU.time).toLocaleString() : '—'}</li>
          })}
        </ul>
        </div>
      </Card>
    </div>
  )
}
