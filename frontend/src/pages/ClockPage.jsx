import React, { useEffect, useMemo, useState } from 'react'
import { Shell, Card } from '../components/Layout'
import { addClock, getClocks } from '../utils/api'
import { useAuth } from '../context/AuthContext'

function groupByDay(entries){
  const map = new Map()
  for (const e of entries) {
    const day = e.toISOString().slice(0,10)
    const arr = map.get(day) || []
    arr.push(e); map.set(day, arr)
  }
  // sort days desc, entries desc
  const days = Array.from(map.entries()).map(([day, list])=>{
    list.sort((a,b)=> a.getTime() - a.getTime())
    return [day, list]
  }).sort((a,b)=> a[0] < b[0] ? 1 : -1)
  return days
}

export default function ClockPage() {
  const { user: me } = useAuth()
  const [last, setLast] = useState(null)
  const [rawData, setRawData] = useState([])

  useEffect(() => {
    if (!me) return
    getClocks(me.id).then(data => setRawData(data || []))
  }, [me, last])

  const grouped = useMemo(() => groupByDay(rawData), [rawData])

  async function act() {
    const entry = await addClock()
    setLast(new Date(entry.at))
  }

  return (
    <Shell>
      <div className="login-wrap">
        <div className="grid-2">
          <Card title="Pointer">
            <div className="flex gap-2">
              <button className="btn-accent" onClick={()=>act()}>Pointer</button>
            </div>
            {last ? <p className="mt-4 subtle">Pointage effectué à {last.toLocaleTimeString()}</p> : null}
          </Card>

          <Card title="Historique">
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
                    <ol className="relative border-s border-gray-200 ps-4 ms-2 overflow-y-auto max-h-[40vh]">
                      {list.map((e, i) => (
                        <li key={"clock-"+i} className="mb-4 ms-2">
                          <span className={`absolute -start-3 mt-1 size-2 rounded-full ${i % 2 == 0 ? 'bg-green-500' : 'bg-red-500'}`}></span>
                          <div className="flex items-center gap-3">
                            <span className={`text-xs px-2 py-1 rounded-full ${i % 2 == 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                              {i % 2 == 0 ? 'Arrivée ⬆️' : 'Départ ⬇️'}
                            </span>
                            <span className="text-sm">{e.toLocaleTimeString()}</span>
                          </div>
                        </li>
                      )).toReversed()}
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
