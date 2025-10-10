import React, { useMemo } from 'react'
import PageShell from '../../components/PageShell.jsx'
import Stat from '../../components/Stat.jsx'
import { LineChartCard, BarChartCard } from '../../components/ChartCard.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { useData } from '../../context/DataContext.jsx'
import * as api from '../../utils/fakeApi.js'

export default function EmployeeHome() {
  const { user } = useAuth()
  const { clocks } = useData()

  const myDaily = useMemo(()=> api.computeDailyHours(clocks.filter(c => c.userId === user.id)), [clocks, user.id])
  const myWeekly = useMemo(()=> api.aggregateWeekly(myDaily), [myDaily])
  const hoursThisWeek = myWeekly.slice(-1)[0]?.hours ?? 0

  return (
    <PageShell title="Mon tableau de bord" description="Vue synthétique de vos heures.">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        <Stat label="Heures cette semaine" value={`${hoursThisWeek} h`} />
        <Stat label="Jours pointés (10 derniers jours)" value={myDaily.length} />
        <Stat label="Moyenne / jour" value={`${(myDaily.reduce((a,c)=>a+c.hours,0) / (myDaily.length||1)).toFixed(2)} h`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <LineChartCard title="Heures par jour" data={myDaily} dataKeyX="day" dataKeyY="hours" />
        <BarChartCard title="Heures par semaine" data={myWeekly} dataKeyX="week" dataKeyY="hours" />
      </div>
    </PageShell>
  )
}
