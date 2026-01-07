import React, { useEffect, useMemo, useState } from 'react'
import { Shell, Card } from '../components/Layout'
import { addClock, getClocks } from '../utils/api'
import { useAuth } from '../context/AuthContext'
import { Clock } from '../utils/types'

function groupByDay(entries: Array<{ date: Date, iso: string }>): [string, Date[]][] {
  const map = new Map<string, Date[]>()
  for (const e of entries) {
    const day = e.date.toISOString().slice(0, 10)
    const arr = map.get(day) || []
    arr.push(e.date)
    map.set(day, arr)
  }

  const days = Array.from(map.entries()).map(([day, list]) => {
    list.sort((a, b) => a.getTime() - b.getTime())
    return [day, list] as [string, Date[]]
  }).sort((a, b) => a[0] < b[0] ? 1 : -1)

  return days
}

export default function ClockPage() {
  useEffect(() => {
    document.title = "Pointage • Time Manager"
  }, [])

  const { user: me } = useAuth()
  const [rawData, setRawData] = useState<Array<{ date: Date, iso: string }>>([])
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  useEffect(() => {
    if (!me) return
    getClocks(me.id).then(data => setRawData(data || []))
  }, [me?.id, refreshTrigger])

  const grouped = useMemo(() => groupByDay(rawData), [rawData])

  async function act() {
    const entry: Clock = await addClock()
    setRefreshTrigger(prev => prev + 1)
  }

  return (
    <Shell>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center mb-12">
          <h1 className="page-title text-center mb-8">Pointage</h1>
          <button 
            className="btn-accent text-2xl px-12 py-6 text-xl font-bold shadow-2xl"
            onClick={() => act()}
            style={{ fontSize: '1.5rem', padding: '1.5rem 3rem' }}
          >
            🕐 Pointer
          </button>
        </div>

        <Card title="📋 Historique des pointages">
          {grouped.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <div className="text-6xl mb-4">📭</div>
              <p className="text-lg">Aucune entrée dans cette période.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {grouped.map(([day, list]) => (
                <div key={day}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="text-sm font-bold tracking-wide uppercase" style={{ color: 'hsl(var(--accent-dark))' }}>
                      📅 {new Date(day + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                    <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, hsl(var(--accent)) 0%, transparent 100%)' }}></div>
                    <div className="text-xs font-semibold px-3 py-1 rounded-full" style={{ background: 'rgba(255, 212, 0, 0.15)', color: 'hsl(var(--ink))' }}>
                      {list.length} évènement{list.length > 1 ? 's' : ''}
                    </div>
                  </div>

                  <ol className="relative border-s-2 ps-6 ms-2 overflow-y-auto max-h-[50vh]" style={{ borderColor: 'rgba(255, 212, 0, 0.3)' }}>
                    {[...list].reverse().map((e, idx) => {
                      const originalIndex = list.length - 1 - idx;
                      const isArrival = originalIndex % 2 === 0;
                      return (
                        <li key={"clock-" + idx} className="mb-6 ms-2">
                          <span 
                            className={`absolute -start-3 mt-1.5 size-3 rounded-full ${isArrival ? 'bg-green-500' : 'bg-red-500'}`}
                            style={{ boxShadow: isArrival ? '0 0 0 3px rgba(16,185,129,0.3)' : '0 0 0 3px rgba(244,63,94,0.3)' }}
                          ></span>
                          <div className="flex items-center gap-4">
                            <span className={`text-sm font-semibold px-3 py-1.5 rounded-full ${isArrival ? 'pill-green' : 'pill-red'}`}>
                              {isArrival ? 'Arrivée' : 'Départ'}
                            </span>
                            <span className="text-base font-medium clock">{e.toLocaleTimeString()}</span>
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </Shell>
  )
}
