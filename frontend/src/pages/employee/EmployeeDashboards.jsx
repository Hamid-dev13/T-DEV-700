import React, { useMemo } from 'react'
import PageShell from '../../components/PageShell.jsx'
import { LineChartCard, BarChartCard } from '../../components/ChartCard.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { useData } from '../../context/DataContext.jsx'
import * as api from '../../utils/fakeApi.js'

export default function EmployeeDashboards() {
  const { user } = useAuth()
  const { clocks } = useData()
  const myDaily = useMemo(()=> api.computeDailyHours(clocks.filter(c => c.userId === user.id)), [clocks, user.id])
  const myWeekly = useMemo(()=> api.aggregateWeekly(myDaily), [myDaily])

  return (
    <PageShell title="Mes tableaux de bord">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <LineChartCard title="Heures par jour" data={myDaily} dataKeyX="day" dataKeyY="hours" />
        <BarChartCard title="Heures par semaine" data={myWeekly} dataKeyX="week" dataKeyY="hours" />
      </div>
    </PageShell>
  )
}
