import React, { useMemo, useState } from 'react'
import PageShell from '../../components/PageShell.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { useData } from '../../context/DataContext.jsx'

export default function ManagerClock() {
  const { user } = useAuth()
  const { clocks, addClock } = useData()
  const [now, setNow] = useState(new Date())

  React.useEffect(()=>{
    const t = setInterval(()=> setNow(new Date()), 1000)
    return ()=> clearInterval(t)
  }, [])

  const myEvents = useMemo(()=> clocks.filter(c => c.userId === user.id).sort((a,b)=> new Date(b.timestamp)-new Date(a.timestamp)), [clocks, user.id])

  const displayEvents = useMemo(()=>{
    const today = new Date().toISOString().slice(0,10)
    if (myEvents.length && myEvents[0].timestamp.slice(0,10) === today && myEvents[0].type === 'out') {
      return myEvents.slice(1)
    }
    return myEvents
  }, [myEvents])

  const onClock = async (type) => {
    await addClock(user.id, type, new Date())
  }

  return (
    <PageShell title="Pointage (Manager)" description="Enregistrez vos heures d'arrivée et de départ.">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <div className="text-3xl font-bold">{now.toLocaleTimeString()}</div>
        <div className="flex gap-2">
          <button onClick={()=>onClock('in')} className="btn-success">Arrivée</button>
          <button onClick={()=>onClock('out')} className="btn-danger">Départ</button>
        </div>
      </div>

      <div className="overflow-auto">
        <table className="w-full text-left">
          <thead className="opacity-70">
            <tr><th className="py-2">Date</th><th>Heure</th><th>Type</th></tr>
          </thead>
          <tbody>
            {displayEvents.slice(0,50).map(e => (
              <tr key={e.id} className="border-t border-white/10">
                <td className="py-2">{new Date(e.timestamp).toLocaleDateString()}</td>
                <td>{new Date(e.timestamp).toLocaleTimeString()}</td>
                <td className="capitalize">{e.type}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PageShell>
  )
}
