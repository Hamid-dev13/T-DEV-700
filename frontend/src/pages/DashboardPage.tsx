import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shell, Card } from '../components/Layout'
import { getClocks, getMyTeams, getTeamUsers } from '../utils/api'
import { useAuth } from '../context/AuthContext'
import { Team, User } from '../utils/types'

interface DailySummary {
  day: string
  hours: number
}

// Calcule les heures travaillées par jour à partir des timestamps de pointage
function computeDailyHours(timestamps: Array<{ date: Date, iso: string }>): DailySummary[] {
  const byDay: { [key: string]: Date[] } = {}
  
  // Grouper les timestamps par jour
  for (const ts of timestamps) {
    const day = ts.date.toISOString().slice(0, 10)
    if (!byDay[day]) byDay[day] = []
    byDay[day].push(ts.date)
  }
  
  const result: DailySummary[] = []
  
  // Calculer les heures pour chaque jour
  for (const [day, times] of Object.entries(byDay)) {
    const sorted = times.sort((a, b) => a.getTime() - b.getTime())
    let totalHours = 0
    
    // Paires de pointages: in/out, in/out, etc.
    for (let i = 0; i < sorted.length - 1; i += 2) {
      const clockIn = sorted[i]
      const clockOut = sorted[i + 1]
      if (clockOut) {
        const diff = clockOut.getTime() - clockIn.getTime()
        totalHours += diff / (1000 * 60 * 60) // Convertir ms en heures
      }
    }
    
    result.push({ day, hours: parseFloat(totalHours.toFixed(2)) })
  }
  
  return result.sort((a, b) => a.day.localeCompare(b.day))
}

// Convertit les heures décimales en format HH:MM
function formatHoursToHHMM(decimalHours: number): string {
  const hours = Math.floor(decimalHours)
  const minutes = Math.round((decimalHours - hours) * 60)
  return `${hours}:${minutes.toString().padStart(2, '0')}`
}

// Génère un tableau de dates pour la semaine en cours (lundi à vendredi seulement)
function getCurrentWeekDays(): string[] {
  const days: string[] = []
  const today = new Date()
  
  // Trouver le lundi de la semaine en cours
  const dayOfWeek = today.getDay() || 7 // Lundi = 1, Dimanche = 7
  const monday = new Date(today)
  monday.setDate(today.getDate() - (dayOfWeek - 1))
  
  // Générer les 5 jours de lundi à vendredi (pas de weekend)
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
  const { user } = useAuth()
  const navigate = useNavigate()
  const [summary, setSummary] = useState<{
    dailyHours: DailySummary[]
    totalWeek: number
    todayHours: number
    last7Days: string[]
  } | null>(null)
  const [managedTeam, setManagedTeam] = useState<TeamWithMembers | null>(null)
  const [teamSummary, setTeamSummary] = useState<{
    totalMembers: number
    avgHoursToday: number
    avgHoursWeek: number
  } | null>(null)
  const [loading, setLoading] = useState(true)
  
  // Fonction pour naviguer vers les détails d'un membre
  const handleMemberClick = (member: User) => {
    // Sauvegarder les infos du membre dans sessionStorage
    sessionStorage.setItem(`member_${member.id}`, JSON.stringify(member))
    // Naviguer vers la page de détails
    navigate(`/member/${member.id}`)
  }

  useEffect(() => {
    if (!user?.id) return

    async function fetchData() {
      try {
        setLoading(true)
        
        const now = new Date()
        
        // Calculer le lundi de la semaine en cours
        const dayOfWeek = now.getDay() || 7 // Lundi = 1, Dimanche = 7
        const monday = new Date(now)
        monday.setDate(now.getDate() - (dayOfWeek - 1))
        
        // Récupérer les pointages depuis le lundi de la semaine en cours
        const timestamps = await getClocks(user!.id, monday, now)
        
        // Calculer les heures par jour
        const dailyHours = computeDailyHours(timestamps)
        
        // Calculer le total de la semaine en cours (utilise le même lundi calculé plus haut)
        const weekStart = monday.toISOString().slice(0, 10)
        
        const totalWeek = dailyHours
          .filter(d => d.day >= weekStart)
          .reduce((sum, d) => sum + d.hours, 0)
        
        // Heures d'aujourd'hui
        const today = now.toISOString().slice(0, 10)
        const todayHours = dailyHours.find(d => d.day === today)?.hours || 0
        
        const last7Days = getCurrentWeekDays()
        
        setSummary({ dailyHours, totalWeek, todayHours, last7Days })
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
    fetchTeamData()
  }, [user])

  // Récupérer les données de l'équipe si l'utilisateur est manager
  async function fetchTeamData() {
    if (!user?.id) return

    try {
      const teams = await getMyTeams() as TeamWithMembers[]
      // Trouver l'équipe où l'utilisateur est manager
      const myManagedTeam = teams.find(t => t.manager.id === user.id)
      
      if (myManagedTeam) {
        setManagedTeam(myManagedTeam)
        
        // Calculer les stats de l'équipe
        const now = new Date()
        
        // Calculer le lundi de la semaine en cours
        const dayOfWeek = now.getDay() || 7
        const monday = new Date(now)
        monday.setDate(now.getDate() - (dayOfWeek - 1))
        const weekStart = monday.toISOString().slice(0, 10)
        
        let totalHoursToday = 0
        let totalHoursWeek = 0
        const today = now.toISOString().slice(0, 10)
        
        // Récupérer les heures de tous les membres
        for (const member of myManagedTeam.members) {
          const timestamps = await getClocks(member.id, monday, now)
          const dailyHours = computeDailyHours(timestamps)
          
          // Heures d'aujourd'hui
          const memberToday = dailyHours.find(d => d.day === today)?.hours || 0
          totalHoursToday += memberToday
          
          // Heures de la semaine
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

  return (
    <Shell>
      <div className="p-6">
        <div className={managedTeam ? "grid grid-cols-2 gap-6" : ""}>
        <Card title="📊 Résumé de vos heures">
          {/* Cartes de statistiques principales */}
          <div className="grid grid-cols-3 gap-6 mb-10">
            {/* Aujourd'hui */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm font-medium text-blue-700">Aujourd'hui</div>
                <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="text-4xl font-bold text-blue-900">
                {summary ? formatHoursToHHMM(summary.todayHours) : '0:00'}
              </div>
              <div className="text-xs text-blue-600 mt-2">Heures travaillées</div>
            </div>

            {/* Cette semaine */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm font-medium text-green-700">Cette semaine</div>
                <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
              <div className="text-4xl font-bold text-green-900">
                {summary ? formatHoursToHHMM(summary.totalWeek) : '0:00'}
              </div>
              <div className="text-xs text-green-600 mt-2">Total hebdomadaire</div>
            </div>

            {/* Moyenne par jour */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm font-medium text-purple-700">Moyenne/jour</div>
                <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
              <div className="text-4xl font-bold text-purple-900">
                {summary ? formatHoursToHHMM(summary.dailyHours.reduce((sum, d) => sum + d.hours, 0) / 5) : '0:00'}
              </div>
              <div className="text-xs text-purple-600 mt-2">Sur la semaine</div>
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
            <div className="space-y-4">
                {summary?.last7Days.map(day => {
                  const dayData = summary.dailyHours.find(d => d.day === day)
                  const hours = dayData?.hours || 0
                  const date = new Date(day)
                  const dayName = date.toLocaleDateString('fr-FR', { weekday: 'long' })
                  const dayMonth = date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })
                  const isToday = day === new Date().toISOString().slice(0, 10)
                  const isWeekend = date.getDay() === 0 || date.getDay() === 6
                  
                  return (
                    <div 
                      key={day} 
                      className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                        isToday 
                          ? 'bg-yellow-50 border-yellow-300 shadow-md' 
                          : 'bg-white border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-14 h-14 rounded-xl flex items-center justify-center font-bold text-sm ${
                          isToday 
                            ? 'bg-yellow-400 text-yellow-900' 
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {dayName.substring(0, 3).toUpperCase()}
                        </div>
                        <div>
                          <div className={`font-semibold capitalize ${isToday ? 'text-yellow-900' : 'text-gray-900'}`}>
                            {dayName}
                          </div>
                          <div className="text-sm text-gray-500">{dayMonth}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        {/* Barre de progression */}
                        <div className="w-64 bg-gray-200 rounded-full h-3 overflow-hidden">
                          <div 
                            className={`h-3 rounded-full transition-all duration-500 ${
                              hours === 0 ? 'bg-gray-300' :
                              hours < 6 ? 'bg-red-400' :
                              hours < 7.5 ? 'bg-orange-400' :
                              'bg-green-400'
                            }`}
                            style={{ width: `${Math.min((hours / 8) * 100, 100)}%` }}
                          />
                        </div>
                        {/* Heures */}
                        <div className="flex items-center gap-2 min-w-[100px]">
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className={`text-xl font-bold ${
                            hours === 0 ? 'text-gray-400' :
                            hours < 6 ? 'text-red-600' :
                            hours < 7.5 ? 'text-orange-600' :
                            'text-green-600'
                          }`}>
                            {formatHoursToHHMM(hours)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
            </div>
          </div>
        </Card>
        
        {managedTeam && (
          <Card title={`Résumé de l'équipe - ${managedTeam.team.name}`}>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-500 mb-1">Membres</div>
                  <div className="text-3xl font-bold">{teamSummary?.totalMembers || 0}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 mb-1">Moyenne aujourd'hui</div>
                  <div className="text-3xl font-bold">{teamSummary ? formatHoursToHHMM(teamSummary.avgHoursToday) : '0:00'}</div>
                </div>
              </div>
              
              <div>
                <div className="text-sm text-gray-500 mb-1">Moyenne cette semaine</div>
                <div className="text-3xl font-bold">{teamSummary ? formatHoursToHHMM(teamSummary.avgHoursWeek) : '0:00'}</div>
              </div>
              
              <div className="mt-6">
                <h3 className="text-sm font-semibold mb-3">Membres de l'équipe</h3>
                <div className="space-y-2">
                  {managedTeam.members.map(member => (
                    <button
                      key={member.id}
                      onClick={() => handleMemberClick(member)}
                      className="w-full flex items-center justify-between p-3 bg-gray-50 rounded hover:bg-yellow-50 hover:border-yellow-300 border border-transparent transition-all cursor-pointer text-left"
                    >
                      <div>
                        <div className="text-sm font-medium">{member.firstName} {member.lastName}</div>
                        <div className="text-xs text-gray-500">{member.email}</div>
                      </div>
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        )}
        </div>
      </div>
    </Shell>
  )
}
