import React, { useEffect, useMemo, useState } from 'react'
import { Shell, Card } from '../components/Layout'
import { getClocks, computeDailyHours, aggregateWeekly } from '../utils/api';
import { useAuth } from '../context/AuthContext';

interface BarData {
  label: string
  value: number
}

interface LinePoint {
  x: string | number
  y: number
}

interface PerDayEntry {
  day: string
  hours: number
}

function iso(d: Date){ return d.toISOString().slice(0,10) }
function startOfWeek(d: Date){
  const x = new Date(d); const day = x.getDay() || 7; x.setHours(0,0,0,0); x.setDate(x.getDate() - (day-1)); return x
}
function rangeDays(n: number, endDate=new Date()): string[] {
  const arr: string[] = []; for(let i=n-1;i>=0;i--){ const d=new Date(endDate); d.setDate(d.getDate()-i); arr.push(iso(d)); } return arr
}
function weekOf(dateStr: string) {
  const d = new Date(dateStr)
  const onejan = new Date(d.getFullYear(),0,1)
  const week = Math.ceil((((d.getTime() - onejan.getTime()) / 86400000) + onejan.getDay()+1)/7)
  return `${d.getFullYear()}-W${String(week).padStart(2,'0')}`
}

/** Enhanced Bar Chart (axes, gridlines, value labels) */
function BarChart({
  data,
  height = 100,
  maxY,
  showValues = true
}: {
  data: BarData[]
  height?: number
  maxY?: number
  showValues?: boolean
}){
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
function LineChart({
  points,
  height = 100
}: {
  points: LinePoint[]
  height?: number
}){
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

export default function DashboardPage(){
  const { user: me } = useAuth()
  const now = new Date()
  const [empData, setEmpData] = useState<{
    bars: BarData[]
    todays: number
    weekTotal: number
    pct7h: number
    lastTime: Date | null
  } | null>(null)

  useEffect(() => {
    if (!me) return

    async function fetchData() {
      const now = new Date()
      const last7Days = rangeDays(7, now)
      
      // Fetch clocks for the last 7 days
      const from = new Date(now)
      from.setDate(from.getDate() - 7)
      const all = await getClocks(me?.id!, from, now)
      const perDay: PerDayEntry[] = computeDailyHours(all)
      const map = new Map(perDay.map(d => [d.day, d.hours]))

      const bars: BarData[] = last7Days.map(day => ({
        label: day,
        value: +(map.get(day) || 0).toFixed(2)
      }))

      const todayISO = iso(now)
      const todays = perDay.find(d => d.day === todayISO)?.hours || 0

      const sw = startOfWeek(now)
      const perWeek = aggregateWeekly(perDay)
      const currentWeek = perWeek.find(w => w.week === weekOf(iso(now)))
      const weekTotal = currentWeek?.hours || 0
      const pct7h = (bars.filter(b => b.value >= 7).length / bars.length) * 100

      const last = all[0] || (all.length ? all[all.length - 1] : null)
      const lastTime = last ? new Date(last) : null

      setEmpData({ bars, todays, weekTotal, pct7h, lastTime })
    }

  fetchData()
}, [me])

  return (
    <Shell>
      <div className="login-wrap">
        {false /* FIXME check if team manager */ ? (
          <ManagerDashboard />
        ) : (
          <div className="grid-2">
            <Card title="Résumé rapide">
              <div className="grid-3">
                <div><div className="subtle">Heures aujourd'hui</div><div className="text-2xl font-semibold">{empData?.todays?.toFixed(2) || '0.00'} h</div></div>
                <div><div className="subtle">Total semaine</div><div className="text-2xl font-semibold">{empData?.weekTotal?.toFixed(2) || '0.00'} h</div></div>
                <div><div className="subtle">% jours ≥ 7h (7j)</div><div className="text-2xl font-semibold">{empData ? Math.round(empData!.pct7h) : 0}%</div></div>
              </div>
              <div className="mt-3 subtle">Dernier pointage: {empData ? empData!.lastTime?.toLocaleString() : '—'}</div>
            </Card>
            <Card title="Mes 7 derniers jours">
              <BarChart data={empData?.bars || []} height={110} />
            </Card>
          </div>
        )}
      </div>
    </Shell>
  )
}

function ManagerDashboard(){
  return (
    <div className="p-6 text-gray-500">TODO</div>
  )
}
