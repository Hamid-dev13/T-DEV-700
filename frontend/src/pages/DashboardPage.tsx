import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shell, Card } from '../components/Layout'
import { getClocks, getDaysOffForUser, getMyTeams, getTeamUsers } from '../utils/api'
import { useAuth } from '../context/AuthContext'
import { Team, User } from '../utils/types'

interface DailySummary {
  day: string
  hours: number
}

function computeDailyHours(timestamps: Array<{ date: Date, iso: string }>): DailySummary[] {
  const byDay: { [key: string]: Date[] } = {}
  
  for (const ts of timestamps) {
    const day = ts.date.toISOString().slice(0, 10)
    if (!byDay[day]) byDay[day] = []
    byDay[day].push(ts.date)
  }
  
  const result: DailySummary[] = []
  
  for (const [day, times] of Object.entries(byDay)) {
    const sorted = times.sort((a, b) => a.getTime() - b.getTime())
    let totalHours = 0
    
    for (let i = 0; i < sorted.length - 1; i += 2) {
      const clockIn = sorted[i]
      const clockOut = sorted[i + 1]
      if (clockOut) {
        const diff = clockOut.getTime() - clockIn.getTime()
        totalHours += diff / (1000 * 60 * 60)
      }
    }
    
    result.push({ day, hours: parseFloat(totalHours.toFixed(2)) })
  }
  
  return result.sort((a, b) => a.day.localeCompare(b.day))
}

function formatHoursToHHMM(decimalHours: number): string {
  const hours = Math.floor(decimalHours)
  const minutes = Math.round((decimalHours - hours) * 60)
  if (minutes === 0) {
    return `${hours}h`
  }
  return `${hours}h${minutes.toString().padStart(2, '0')}`
}

function getCurrentWeekDays(): string[] {
  const days: string[] = []
  const today = new Date()
  
  const dayOfWeek = today.getDay() || 7
  const monday = new Date(today)
  monday.setDate(today.getDate() - (dayOfWeek - 1))
  
  for (let i = 0; i < 5; i++) {
    const date = new Date(monday)
    date.setDate(monday.getDate() + i)
    days.push(date.toISOString().slice(0, 10))
  }
  
  return days
}

interface TeamWithMembers {
  team: Team
  manager: User
  members: User[]
}

export default function DashboardPage() {
  useEffect(() => {
    document.title = "Dashboard • Time Manager"
  }, [])

  const { user } = useAuth()
  const navigate = useNavigate()
  const [summary, setSummary] = useState<{
    dailyHours: DailySummary[]
    totalWeek: number
    todayHours: number
    last7Days: string[]
    daysOff: string[]
    workingDaysCount: number
  } | null>(null)
  const [managedTeam, setManagedTeam] = useState<TeamWithMembers | null>(null)
  const [userTeam, setUserTeam] = useState<Team | null>(null)
  const [teamSummary, setTeamSummary] = useState<{
    totalMembers: number
    avgHoursToday: number
    avgHoursWeek: number
  } | null>(null)
  const [loading, setLoading] = useState(true)
  
  const handleMemberClick = (member: User) => {
    sessionStorage.setItem(`member_${member.id}`, JSON.stringify(member))
    navigate(`/member/${member.id}`)
  }

  useEffect(() => {
    if (!user?.id) return

    async function fetchData() {
      try {
        setLoading(true)
        
        const now = new Date()
        
        const dayOfWeek = now.getDay() || 7
        const monday = new Date(now)
        monday.setDate(now.getDate() - (dayOfWeek - 1))
        
        const timestamps = await getClocks(user!.id, monday, now)
        
        const dailyHours = computeDailyHours(timestamps)
        
        const weekStart = monday.toISOString().slice(0, 10)
        
        const totalWeek = dailyHours
          .filter(d => d.day >= weekStart)
          .reduce((sum, d) => sum + d.hours, 0)
        
        const today = now.toISOString().slice(0, 10)
        const todayHours = dailyHours.find(d => d.day === today)?.hours || 0
        
        const last7Days = getCurrentWeekDays()

        const daysOff = await getDaysOffForUser(user!.id, last7Days[0], last7Days[last7Days.length - 1])

        const workingDaysCount = last7Days.filter(d => !daysOff.includes(d)).length

        setSummary({ dailyHours, totalWeek, todayHours, last7Days, daysOff, workingDaysCount })
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
    fetchTeamData()
    fetchUserTeam()
  }, [user])

  async function fetchUserTeam() {
    if (!user?.id) return

    try {
      const teams = await getMyTeams() as TeamWithMembers[]

      if (teams.length > 0) {
        setUserTeam(teams[0].team)
      }
    } catch (error) {
      console.error('Erreur lors du chargement de l\'équipe de l\'utilisateur:', error)
    }
  }

  async function fetchTeamData() {
    if (!user?.id) return

    try {
      const teams = await getMyTeams() as TeamWithMembers[]

      const myManagedTeam = teams.find(t => t.manager.id === user.id)
      
      if (myManagedTeam) {
        setManagedTeam(myManagedTeam)
        

        const now = new Date()
        

        const dayOfWeek = now.getDay() || 7
        const monday = new Date(now)
        monday.setDate(now.getDate() - (dayOfWeek - 1))
        const weekStart = monday.toISOString().slice(0, 10)
        
        let totalHoursToday = 0
        let totalHoursWeek = 0
        const today = now.toISOString().slice(0, 10)
        

        for (const member of myManagedTeam.members) {
          const timestamps = await getClocks(member.id, monday, now)
          const dailyHours = computeDailyHours(timestamps)
          

          const memberToday = dailyHours.find(d => d.day === today)?.hours || 0
          totalHoursToday += memberToday
          

          const memberWeek = dailyHours
            .filter(d => d.day >= weekStart)
            .reduce((sum, d) => sum + d.hours, 0)
          totalHoursWeek += memberWeek
        }
        
        const memberCount = myManagedTeam.members.length || 1
        setTeamSummary({
          totalMembers: myManagedTeam.members.length,
          avgHoursToday: totalHoursToday / memberCount,
          avgHoursWeek: totalHoursWeek / memberCount
        })
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données de l\'équipe:', error)
    }
  }

  if (loading) {
    return (
      <Shell>
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center py-20">
            <div className="spinner mb-4"></div>
            <p className="subtle">Récupération de vos données...</p>
          </div>
        </div>
      </Shell>
    )
  }

  const dayHoursTarget = userTeam ? (userTeam.endHour - userTeam.startHour) : 0
  const weekHoursTarget = summary ? dayHoursTarget * summary.workingDaysCount : 0

  return (
    <Shell>
      <div className="p-6 max-w-7xl mx-auto">
        <Card title="📊 Résumé de vos heures">
          {/* En-tête avec progression hebdomadaire */}
          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-2xl p-6 mb-8 border-2 border-yellow-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-1">Cette semaine</h3>
                <p className="text-sm text-gray-600">Objectif : {formatHoursToHHMM(weekHoursTarget)} ({formatHoursToHHMM(dayHoursTarget)}/jour)</p>
              </div>
              <div className="text-right">
                <div className="text-5xl font-bold text-yellow-600">
                  {summary ? formatHoursToHHMM(summary.totalWeek) : '0:00'}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  sur {formatHoursToHHMM(weekHoursTarget)}
                </div>
              </div>
            </div>
            
            {/* Barre de progression hebdomadaire */}
            <div className="relative">
              <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                <div 
                  className={`h-4 rounded-full transition-all duration-700 ${
                    summary && summary.totalWeek >= weekHoursTarget ? 'bg-green-500' :
                    summary && summary.totalWeek >= Math.round(weekHoursTarget * 0.8) ? 'bg-yellow-500' :
                    'bg-orange-500'
                  }`}
                  style={{ width: `${Math.min((summary?.totalWeek || 0) / weekHoursTarget * 100, 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-2">
                <span>0h</span>
                <span>{formatHoursToHHMM(weekHoursTarget * 0.5)}</span>
                <span className="font-semibold">{formatHoursToHHMM(weekHoursTarget)}</span>
              </div>
            </div>
            
            {/* Indicateur de progression */}
            <div className="mt-4 flex items-center justify-center gap-2">
              {summary && summary.totalWeek >= weekHoursTarget ? (
                <>
                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm font-semibold text-green-600">Objectif atteint ! 🎉</span>
                </>
              ) : (
                <span className="text-sm text-gray-600">
                  Encore {formatHoursToHHMM(Math.max(weekHoursTarget - (summary?.totalWeek || 0), 0))} pour atteindre l'objectif
                </span>
              )}
            </div>
          </div>

          {/* Statistiques rapides */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            {/* Aujourd'hui */}
            <div className="bg-white rounded-xl p-5 border-2 border-gray-200 hover:border-blue-300 transition-all">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="text-sm font-semibold text-gray-700">Aujourd'hui</div>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">
                {summary ? formatHoursToHHMM(summary.todayHours) : '0:00'}
              </div>
              <div className="flex items-center gap-1">
                <div className="text-xs text-gray-500">Objectif: {formatHoursToHHMM(dayHoursTarget)}</div>
                {summary && summary.todayHours >= dayHoursTarget && (
                  <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
            </div>

            {/* Moyenne par jour */}
            <div className="bg-white rounded-xl p-5 border-2 border-gray-200 hover:border-purple-300 transition-all">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div className="text-sm font-semibold text-gray-700">Moyenne/jour</div>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">
                {summary ? formatHoursToHHMM(summary.totalWeek / 5) : '0:00'}
              </div>
              <div className="text-xs text-gray-500">Sur la semaine</div>
            </div>

            {/* Jours travaillés */}
            <div className="bg-white rounded-xl p-5 border-2 border-gray-200 hover:border-green-300 transition-all">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="text-sm font-semibold text-gray-700">Jours travaillés</div>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">
                {summary ? summary.dailyHours.filter(d => d.hours > 0).length : 0}/{summary ? summary.workingDaysCount : 0}
              </div>
              <div className="text-xs text-gray-500">Cette semaine</div>
            </div>
          </div>
          
          {/* Détail par jour */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Détail par jour
            </h3>
            <div className="space-y-3">
                {summary?.last7Days.map(day => {
                  const dayData = summary.dailyHours.find(d => d.day === day)
                  const hours = dayData?.hours || 0
                  const date = new Date(day)
                  const dayName = date.toLocaleDateString('fr-FR', { weekday: 'long' })
                  const dayMonth = date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
                  const isToday = day === new Date().toISOString().slice(0, 10)
                  const targetHours = 8
                  const progress = (hours / targetHours) * 100
                  const isDayOff = summary.daysOff.includes(day)
                  
                  return (
                    <div 
                      key={day} 
                      className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                          isToday 
                          ? isDayOff ? 'bg-gray-100 border-gray-300'
                          : 'bg-yellow-50 border-yellow-400 shadow-lg' 
                          : isDayOff ? 'bg-gray-100 border-gray-200 hover:border-gray-300 hover:shadow-md'
                          : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-center gap-4 min-w-[180px]">
                        <div className={`w-14 h-14 rounded-xl flex items-center justify-center font-bold text-sm shadow-sm ${
                          isToday && !isDayOff
                            ? 'bg-yellow-500 text-white' 
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {dayName.substring(0, 3).toUpperCase()}
                        </div>
                        <div>
                          <div className={`font-bold capitalize ${isToday && !isDayOff ? 'text-yellow-900' : 'text-gray-900'}`}>
                            {dayName}
                          </div>
                          <div className="text-xs text-gray-500">{dayMonth}</div>
                        </div>
                      </div>

                      {isDayOff ? (
                        <div className="flex-1 p-4 rounded-full text-gray-500">Jour de repos</div>
                      ) :
                        <div className="flex-1 mx-4">
                          <div className="flex items-center gap-6 flex-1">
                            {/* Barre de progression avec objectif 7h */}
                            <div className="flex-1 max-w-md">
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-xs text-gray-500">Progression</span>
                                <span className="text-xs font-semibold text-gray-600">{Math.round(progress)}%</span>
                              </div>
                              <div className="relative w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                                <div 
                                  className={`h-3 rounded-full transition-all duration-500 ${
                                    hours === 0 ? 'bg-gray-300' :
                                    hours < Math.round(dayHoursTarget * 0.625) ? 'bg-red-500' :
                                    hours < dayHoursTarget ? 'bg-orange-500' :
                                    hours >= dayHoursTarget ? 'bg-green-500' :
                                    'bg-yellow-500'
                                  }`}
                                  style={{ width: `${Math.min(progress, 100)}%` }}
                                />
                                {/* Ligne d'objectif à 7h */}
                                <div className="absolute top-0 left-[100%] w-0.5 h-3 bg-gray-400" style={{ transform: 'translateX(-1px)' }}></div>
                              </div>
                            </div>
                            
                            {/* Heures avec indicateur */}
                            <div className="flex items-center gap-3 min-w-[140px]">
                              <div className="text-right">
                                <div className={`text-2xl font-bold ${
                                  hours === 0 ? 'text-gray-400' :
                                  hours < Math.round(dayHoursTarget * 0.625) ? 'text-red-600' :
                                  hours < dayHoursTarget ? 'text-orange-600' :
                                  'text-green-600'
                                }`}>
                                  {formatHoursToHHMM(hours)}
                                </div>
                                <div className="text-xs text-gray-500">/ {formatHoursToHHMM(dayHoursTarget)}</div>
                              </div>
                              
                              {/* Icône de statut */}
                              {hours >= 8 ? (
                                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                  </svg>
                                </div>
                              ) : hours > 0 ? (
                                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                                  <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                </div>
                              ) : (
                                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      }
                    </div>
                  )
                })}
            </div>
          </div>
        </Card>
        
        {managedTeam && (
          <Card title={`👥 Résumé de l'équipe - ${managedTeam.team.name}`}>
            {/* Statistiques de l'équipe */}
            <div className="grid grid-cols-3 gap-6 mb-8">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border-2 border-blue-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div className="text-sm font-semibold text-blue-700">Membres</div>
                </div>
                <div className="text-4xl font-bold text-blue-900">{teamSummary?.totalMembers || 0}</div>
                <div className="text-xs text-blue-600 mt-1">Dans l'équipe</div>
              </div>
              
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border-2 border-purple-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="text-sm font-semibold text-purple-700">Aujourd'hui</div>
                </div>
                <div className="text-4xl font-bold text-purple-900">{teamSummary ? formatHoursToHHMM(teamSummary.avgHoursToday) : '0:00'}</div>
                <div className="text-xs text-purple-600 mt-1">Moyenne par membre</div>
              </div>
              
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border-2 border-green-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="text-sm font-semibold text-green-700">Cette semaine</div>
                </div>
                <div className="text-4xl font-bold text-green-900">{teamSummary ? formatHoursToHHMM(teamSummary.avgHoursWeek) : '0:00'}</div>
                <div className="text-xs text-green-600 mt-1">Moyenne par membre</div>
              </div>
            </div>
            
            {/* Liste des membres */}
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                Membres de l'équipe
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {managedTeam.members.map(member => (
                  <button
                    key={member.id}
                    onClick={() => handleMemberClick(member)}
                    className="flex items-center justify-between p-4 bg-white rounded-xl border-2 border-gray-200 hover:border-yellow-400 hover:bg-yellow-50 hover:shadow-lg transition-all cursor-pointer text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {member.firstName.charAt(0)}{member.lastName.charAt(0)}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-gray-900">{member.firstName} {member.lastName}</div>
                        <div className="text-xs text-gray-500">{member.email}</div>
                      </div>
                    </div>
                    <svg className="w-5 h-5 text-gray-400 group-hover:text-yellow-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                ))}
              </div>
            </div>
          </Card>
        )}
      </div>
    </Shell>
  )
}
