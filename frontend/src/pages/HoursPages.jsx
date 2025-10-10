import React, { useMemo, useState } from 'react'
import { Shell, Card } from '../components/Layout'
import { currentUser, computeDailyHoursForUser } from '../auth'

export default function HoursPage({ backTo = '/manager' }) {
  const me = currentUser()

  // Période par défaut : cette semaine (lun → aujourd’hui)
  const now = new Date()
  const weekStart = new Date(now)
  const day = (weekStart.getDay() + 6) % 7 // 0 = lundi
  weekStart.setDate(weekStart.getDate() - day)
  weekStart.setHours(0, 0, 0, 0)

  const [start, setStart] = useState(weekStart.toISOString().slice(0, 10))
  const [end, setEnd] = useState(new Date().toISOString().slice(0, 10))

  const data = useMemo(() => {
    if (!me) return []
    const startISO = new Date(start + 'T00:00:00.000Z').toISOString()
    const endISO = new Date(end + 'T23:59:59.999Z').toISOString()
    return computeDailyHoursForUser(me.id, startISO, endISO)
  }, [me, start, end])

  const total = useMemo(
    () => data.reduce((s, d) => s + d.hours, 0),
    [data]
  )

  const fmtH = (n) => (Math.round(n * 100) / 100).toFixed(2).replace('.', ',')

  return (
    <Shell>
      <div className="login-wrap">
        <div className="grid-2">
          <Card title="Filtre">
            <div className="flex items-end gap-3">
              <div>
                <label className="label">Début</label>
                <input className="input mt-1" type="date" value={start} onChange={e => setStart(e.target.value)} />
              </div>
              <div>
                <label className="label">Fin</label>
                <input className="input mt-1" type="date" value={end} onChange={e => setEnd(e.target.value)} />
              </div>
              <div className="ml-auto text-right">
                <div className="subtle">Total (période)</div>
                <div className="text-2xl font-bold">{fmtH(total)} h</div>
              </div>
            </div>
          </Card>

          <Card title="Heures par jour">
            {data.length === 0 ? (
              <p className="subtle">Aucune donnée pour cette période.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="table w-full">
                  <thead>
                    <tr>
                      <th className="text-left">Jour</th>
                      <th className="text-left">Heures</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((d) => (
                      <tr key={d.day}>
                        <td>{d.day}</td>
                        <td>{fmtH(d.hours)} h</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      </div>
    </Shell>
  )
}
