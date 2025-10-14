
import React, { useMemo, useState } from 'react'
import { Shell, Card } from '../components/Layout'
import { punch, currentUser, entriesForUser } from '../auth'

const RANGES = [
  { key: 'today', label: "Aujourd'hui", days: 1 },
  { key: '7d', label: '7 jours', days: 7 },
  { key: '30d', label: '30 jours', days: 30 },
  { key: 'all', label: 'Tout', days: null },
]

function groupByDay(entries){
  const map = new Map()
  for (const e of entries) {
    const d = new Date(e.time)
    const day = d.toISOString().slice(0,10)
    const arr = map.get(day) || []
    arr.push(e); map.set(day, arr)
  }
  // sort days desc, entries desc
  const days = Array.from(map.entries()).map(([day, list])=>{
    list.sort((a,b)=> new Date(b.time) - new Date(a.time))
    return [day, list]
  }).sort((a,b)=> a[0] < b[0] ? 1 : -1)
  return days
}

export default function ClockPage() {
  const [last, setLast] = useState(null)
  const [range, setRange] = useState('7d')

  const me = currentUser()
  const raw = useMemo(()=> me ? entriesForUser(me.id) : [], [me, last])
  const filtered = useMemo(()=>{
    if (!raw.length) return []
    if (range === 'all') return raw
    const days = RANGES.find(r=>r.key===range)?.days ?? 7
    const since = new Date(Date.now() - days*864e5)
    return raw.filter(e => new Date(e.time) >= since)
  }, [raw, range])

  const limited = useMemo(()=> filtered.slice(0, 8), [filtered])

  const grouped = useMemo(()=> groupByDay(limited), [limited])

  function act(kind){
    const entry = punch(kind)
    setLast(entry)
  }

  return (
    <Shell>
      <div className="login-wrap">
        <div className="grid-2">
          <Card title="Pointer">
            <div className="flex gap-2">
              <button className="btn-accent" onClick={()=>act('in')}>Arrivée</button>
              <button className="btn-ghost" onClick={()=>act('out')}>Départ</button>
            </div>
            {last ? <p className="mt-4 subtle">Dernière action: …{last.kind} @ {new Date(last.time).toLocaleString()}</p> : null}
          </Card>

          <Card title="Historique">
            {/* Range selector */}
            <div className="mb-4 flex flex-wrap gap-2">
              {RANGES.map(r => (
                <button
                  key={r.key}
                  onClick={()=>setRange(r.key)}
                  className={`px-3 py-1 rounded-full border ${range===r.key ? 'bg-black text-white' : 'bg-white'} border-gray-200`}
                >
                  {r.label}
                </button>
              ))}
            </div>

            {/* Empty state */}
            {grouped.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                Aucune entrée dans cette période.
              </div>
            ) : (
              <div className="space-y-6">
                {grouped.map(([day, list]) => (
                  <div key={day}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="text-sm font-semibold tracking-wide uppercase text-gray-500">{new Date(day+'T00:00:00').toLocaleDateString()}</div>
                      <div className="flex-1 h-px bg-gray-200"></div>
                      <div className="text-xs text-gray-400">{list.length} évènement{list.length>1?'s':''}</div>
                    </div>

                    {/* Timeline */}
                    <ol className="relative border-s border-gray-200 ps-4 ms-2">
                      {list.map(e => (
                        <li key={e.id} className="mb-4 ms-2">
                          <span className={`absolute -start-3 mt-1 size-2 rounded-full ${e.kind==='in' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                          <div className="flex items-center gap-3">
                            <span className={`text-xs px-2 py-1 rounded-full ${e.kind==='in' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                              {e.kind==='in' ? 'Arrivée ⬆️' : 'Départ ⬇️'}
                            </span>
                            <span className="text-sm">{new Date(e.time).toLocaleTimeString()}</span>
                            <span className="text-xs text-gray-500">{new Date(e.time).toLocaleString()}</span>
                          </div>
                        </li>
                      ))}
                    </ol>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </Shell>
  )
}
