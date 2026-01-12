import React, { useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Shell, Card } from '../components/Layout'
import { getReports, getDaysOffForUser } from '../utils/api'
import BarChart from '../components/BarChart'

interface MemberInfo {
  id: string
  firstName: string
  lastName: string
  email: string
}

interface PresenceData {
  day: string
  time: number
}

interface LatenessData {
  day: string
  lateness: number
}

type PeriodType = 'current_week' | 'last_week' | 'current_month' | 'last_month' | 'custom'

export default function MemberSummaryPage() {
  useEffect(() => {
    document.title = "Résumé du membre • Time Manager"
  }, [])

  const { memberId } = useParams<{ memberId: string }>()
  const navigate = useNavigate()
  const [member, setMember] = useState<MemberInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [presenceData, setPresenceData] = useState<PresenceData[]>([])
  const [latenessData, setLatenessData] = useState<LatenessData[]>([])
  const [daysOff, setDaysOff] = useState<string[]>([])
  const [periodType, setPeriodType] = useState<PeriodType>('current_week')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')

  const getPeriodDates = () => {
    const today = new Date()
    let from: Date
    let to: Date

    switch (periodType) {
      case 'current_week':
        const dayOfWeek = today.getDay()
        const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1
        from = new Date(today)
        from.setDate(today.getDate() - daysToSubtract)
        from.setHours(0, 0, 0, 0)
        to = new Date(from)
        to.setDate(from.getDate() + 6)
        to.setHours(23, 59, 59, 999)
        break

      case 'last_week':
        const lastWeekDay = today.getDay()
        const lastWeekDaysToSubtract = lastWeekDay === 0 ? 6 : lastWeekDay - 1
        const lastMonday = new Date(today)
        lastMonday.setDate(today.getDate() - lastWeekDaysToSubtract - 7)
        lastMonday.setHours(0, 0, 0, 0)
        from = lastMonday
        to = new Date(lastMonday)
        to.setDate(lastMonday.getDate() + 6)
        to.setHours(23, 59, 59, 999)
        break

      case 'current_month':
        from = new Date(today.getFullYear(), today.getMonth(), 1)
        from.setHours(0, 0, 0, 0)
        to = new Date(today.getFullYear(), today.getMonth() + 1, 0)
        to.setHours(23, 59, 59, 999)
        break

      case 'last_month':
        from = new Date(today.getFullYear(), today.getMonth() - 1, 1)
        from.setHours(0, 0, 0, 0)
        to = new Date(today.getFullYear(), today.getMonth(), 0)
        to.setHours(23, 59, 59, 999)
        break

      case 'custom':
        if (customStartDate && customEndDate) {
          from = new Date(customStartDate)
          from.setHours(0, 0, 0, 0)
          to = new Date(customEndDate)
          to.setHours(23, 59, 59, 999)
        } else {
          from = new Date()
          to = new Date()
        }
        break

      default:
        from = new Date()
        to = new Date()
    }

    return { from, to }
  }

  useEffect(() => {
    if (!memberId) return
    if (periodType === 'custom' && (!customStartDate || !customEndDate)) return

    async function loadData() {
      try {
        setLoading(true)

        const memberDataStr = sessionStorage.getItem(`member_${memberId}`)
        if (memberDataStr) {
          const memberData = JSON.parse(memberDataStr)
          setMember(memberData)
        }

        if (!memberId) {
          console.error('Member ID is undefined')
          return
        }

        const { from, to } = getPeriodDates()

        const formatLocalDate = (date: Date) => {
          const year = date.getFullYear()
          const month = String(date.getMonth() + 1).padStart(2, '0')
          const day = String(date.getDate()).padStart(2, '0')
          return `${year}-${month}-${day}`
        }

        const [presenceKPI, latenessKPI, daysOffData] = await Promise.all([
          getReports(memberId, 'presence', from, to),
          getReports(memberId, 'lateness', from, to),
          getDaysOffForUser(memberId, formatLocalDate(from), formatLocalDate(to))
        ])

        setDaysOff(daysOffData)

        const presenceMap = new Map<string, number>()
        const latenessMap = new Map<string, number>()

        presenceKPI.forEach((item: any) => {
          presenceMap.set(item.day, item.time)
        })

        latenessKPI.forEach((item: any) => {
          latenessMap.set(item.day, item.lateness)
        })

        const allDays: string[] = []
        const currentDate = new Date(from)
        while (currentDate <= to) {
          const dayOfWeek = currentDate.getDay()
          if (dayOfWeek !== 0 && dayOfWeek !== 6) {
            allDays.push(formatLocalDate(currentDate))
          }
          currentDate.setDate(currentDate.getDate() + 1)
        }

        const presenceArray = allDays.map(day => ({
          day,
          time: presenceMap.get(day) || 0
        }))

        const latenessArray = allDays.map(day => ({
          day,
          lateness: latenessMap.get(day) || 0
        }))

        setPresenceData(presenceArray)
        setLatenessData(latenessArray)

      } catch (error) {
        console.error('Erreur lors du chargement des données:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [memberId, periodType, customStartDate, customEndDate])

  if (loading) {
    return (
      <Shell>
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center py-20">
            <div className="spinner mb-4"></div>
            <p className="subtle">Chargement des résumés...</p>
          </div>
        </div>
      </Shell>
    )
  }

  return (
    <Shell>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Bouton retour */}
        <button
          onClick={() => navigate(`/member/${memberId}`)}
          className="flex items-center text-sm text-gray-600 hover:text-yellow-600 transition-colors mb-6"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Retour aux détails
        </button>

        {/* En-tête avec infos du membre */}
        <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-xl p-6 mb-6 border border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Résumés - {member?.firstName} {member?.lastName}
              </h1>
              <p className="text-gray-600">{member?.email}</p>
            </div>
            <div className="text-right">
              <svg className="w-16 h-16 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Sélecteur de période */}
        <Card title="Sélectionner une période">
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setPeriodType('current_week')}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  periodType === 'current_week'
                    ? 'bg-yellow-400 text-gray-900 shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Semaine en cours
              </button>
              <button
                onClick={() => setPeriodType('last_week')}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  periodType === 'last_week'
                    ? 'bg-yellow-400 text-gray-900 shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Semaine dernière
              </button>
              <button
                onClick={() => setPeriodType('current_month')}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  periodType === 'current_month'
                    ? 'bg-yellow-400 text-gray-900 shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Mois en cours
              </button>
              <button
                onClick={() => setPeriodType('last_month')}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  periodType === 'last_month'
                    ? 'bg-yellow-400 text-gray-900 shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Mois dernier
              </button>
              <button
                onClick={() => setPeriodType('custom')}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  periodType === 'custom'
                    ? 'bg-yellow-400 text-gray-900 shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Personnalisé
              </button>
            </div>

            {periodType === 'custom' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date de début
                  </label>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="input w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date de fin
                  </label>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="input w-full"
                  />
                </div>
              </div>
            )}

            <div className="text-sm text-gray-600 bg-blue-50 border border-blue-200 rounded-lg p-3">
              <strong>Période sélectionnée:</strong> {
                periodType === 'current_week' ? 'Semaine en cours' :
                periodType === 'last_week' ? 'Semaine dernière' :
                periodType === 'current_month' ? 'Mois en cours' :
                periodType === 'last_month' ? 'Mois dernier' :
                customStartDate && customEndDate ? `Du ${new Date(customStartDate).toLocaleDateString('fr-FR')} au ${new Date(customEndDate).toLocaleDateString('fr-FR')}` :
                'Veuillez sélectionner des dates'
              }
            </div>
          </div>
        </Card>

        {/* Section des graphiques - GROS GRAPHIQUES */}
        <div className="space-y-6 mb-6">
          {/* Graphique 1 - Heures travaillées par jour */}
          <Card title={`Heures travaillées - ${
            periodType === 'current_week' ? 'Semaine en cours' :
            periodType === 'last_week' ? 'Semaine dernière' :
            periodType === 'current_month' ? 'Mois en cours' :
            periodType === 'last_month' ? 'Mois dernier' :
            'Période personnalisée'
          }`}>
            {presenceData.length > 0 ? (
              <div>
                <BarChart
                  data={presenceData.map(d => {
                    const date = new Date(d.day)
                    const dayName = date.toLocaleDateString('fr-FR', { weekday: 'short' })
                    const dayNum = date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
                    const isDayOff = daysOff.includes(d.day)
                    return {
                      label: `${dayName} ${dayNum}${isDayOff ? ' 🏖️' : ''}`,
                      value: d.time
                    }
                  })}
                  color="#10b981"
                  unit="h"
                  height={400}
                />
                <div className="mt-4 flex justify-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-500 rounded"></div>
                    <span>Heures travaillées</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>🏖️</span>
                    <span>Jour de repos</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <div className="text-center">
                  <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <p className="text-gray-600 font-medium mb-2">Aucune donnée disponible</p>
                  <p className="text-gray-500 text-sm">Les heures travaillées apparaîtront ici</p>
                </div>
              </div>
            )}
          </Card>

          {/* Graphique 2 - Retards par jour */}
          <Card title={`Retards - ${
            periodType === 'current_week' ? 'Semaine en cours' :
            periodType === 'last_week' ? 'Semaine dernière' :
            periodType === 'current_month' ? 'Mois en cours' :
            periodType === 'last_month' ? 'Mois dernier' :
            'Période personnalisée'
          }`}>
            {latenessData.length > 0 ? (
              <BarChart
                data={latenessData.map(d => {
                  const date = new Date(d.day)
                  const dayName = date.toLocaleDateString('fr-FR', { weekday: 'short' })
                  const dayNum = date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
                  return {
                    label: `${dayName} ${dayNum}`,
                    value: d.lateness
                  }
                })}
                color="#ef4444"
                unit="min"
                height={400}
              />
            ) : (
              <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <div className="text-center">
                  <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-gray-600 font-medium mb-2">Aucune donnée disponible</p>
                  <p className="text-gray-500 text-sm">Les retards apparaîtront ici</p>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Section des statistiques récapitulatives */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Stat 1 - Total heures */}
          <Card title="Total heures travaillées">
            <div className="flex flex-col items-center justify-center py-8">
              <div className="text-5xl font-bold text-green-600 mb-2">
                {presenceData.length > 0 ? (
                  `${Math.floor(presenceData.reduce((sum, d) => sum + d.time, 0) / 60)}h${Math.round(presenceData.reduce((sum, d) => sum + d.time, 0) % 60).toString().padStart(2, '0')}`
                ) : '0h00'}
              </div>
              <div className="text-sm text-gray-500">
                {periodType === 'current_week' ? 'Cette semaine' :
                 periodType === 'last_week' ? 'Semaine dernière' :
                 periodType === 'current_month' ? 'Ce mois' :
                 periodType === 'last_month' ? 'Mois dernier' :
                 'Période sélectionnée'}
              </div>
            </div>
          </Card>

          {/* Stat 2 - Moyenne journalière */}
          <Card title="Moyenne d'heure par jour">
            <div className="flex flex-col items-center justify-center py-8">
              <div className="text-5xl font-bold text-blue-600 mb-2">
                {(() => {
                  const workingDays = presenceData.filter(d => !daysOff.includes(d.day)).length
                  const totalMinutes = presenceData.reduce((sum, d) => sum + d.time, 0)
                  const avgMinutes = workingDays > 0 ? totalMinutes / workingDays : 0
                  return `${Math.floor(avgMinutes / 60)}h${Math.round(avgMinutes % 60).toString().padStart(2, '0')}`
                })()}
              </div>
              <div className="text-sm text-gray-500">Heures/jour (hors repos)</div>
            </div>
          </Card>

          {/* Stat 3 - Retard de la semaine */}
          <Card title="Retard de la semaine">
            <div className="flex flex-col items-center justify-center py-8">
              <div className="text-5xl font-bold text-red-600 mb-2">
                {latenessData.length > 0 ? (
                  `${Math.round(latenessData.reduce((sum, d) => sum + d.lateness, 0))}`
                ) : '0'}
                <span className="text-2xl ml-1">min</span>
              </div>
              <div className="text-sm text-gray-500">
                {periodType === 'current_week' ? 'Total cette semaine' :
                 periodType === 'last_week' ? 'Total semaine dernière' :
                 periodType === 'current_month' ? 'Total ce mois' :
                 periodType === 'last_month' ? 'Total mois dernier' :
                 'Total période sélectionnée'}
              </div>
            </div>
          </Card>
        </div>

      </div>
    </Shell>
  )
}
