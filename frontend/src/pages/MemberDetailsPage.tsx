import React, { useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Shell, Card } from '../components/Layout'
import { getClocks, getTeamsWithMembers } from '../utils/api'

interface DailySummary {
  day: string
  hours: number
}

interface MemberInfo {
  id: string
  firstName: string
  lastName: string
  email: string
}

interface Team {
  id: string
  name: string
  startHour: number
  endHour: number
  members: any[]
}

// Calcule les heures travaillées par jour
function computeDailyHours(timestamps: Date[]): DailySummary[] {
  const byDay: { [key: string]: Date[] } = {}
  
  for (const ts of timestamps) {
    const day = ts.toISOString().slice(0, 10)
    if (!byDay[day]) byDay[day] = []
    byDay[day].push(ts)
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

// Convertit les heures décimales en format HH:MM
function formatHoursToHHMM(decimalHours: number): string {
  const hours = Math.floor(decimalHours)
  const minutes = Math.round((decimalHours - hours) * 60)
  return `${hours}h${minutes.toString().padStart(2, '0')}`
}

// Génère les jours de la semaine en cours (lundi à vendredi)
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

// Calcule le retard basé sur l'heure de premier pointage
function calculateDelay(timestamps: Date[], targetDay: string, expectedHour: number): { status: string, minutes: number | null } {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const targetDate = new Date(targetDay)
  targetDate.setHours(0, 0, 0, 0)
  
  if (targetDate > today) {
    return { status: 'future', minutes: null }
  }
  
  const dayTimestamps = timestamps.filter(ts => ts.toISOString().slice(0, 10) === targetDay)
  
  if (dayTimestamps.length === 0) {
    return { status: 'absent', minutes: null }
  }
  
  const firstClock = dayTimestamps.sort((a, b) => a.getTime() - b.getTime())[0]
  
  const parisTime = firstClock.toLocaleString('fr-FR', { 
    timeZone: 'Europe/Paris',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })
  const [hourStr, minuteStr] = parisTime.split(':')
  const hour = parseInt(hourStr, 10)
  const minute = parseInt(minuteStr, 10)
  
  const actualMinutes = hour * 60 + minute
  const expectedMinutes = expectedHour * 60
  const delayMinutes = actualMinutes - expectedMinutes
  
  let status = 'on_time'
  if (delayMinutes > 5) status = 'late'
  else if (delayMinutes < -5) status = 'early'
  
  return { status, minutes: delayMinutes }
}

export default function MemberDetailsPage() {
  const { memberId } = useParams<{ memberId: string }>()
  const navigate = useNavigate()
  const [member, setMember] = useState<MemberInfo | null>(null)
  const [timestamps, setTimestamps] = useState<Date[]>([])
  const [memberTeam, setMemberTeam] = useState<Team | null>(null)
  const [loading, setLoading] = useState(true)

  // Charger les données du membre
  useEffect(() => {
    if (!memberId) return

    async function loadData() {
      try {
        setLoading(true)
        
        // Récupérer les infos du membre depuis sessionStorage
        const memberDataStr = sessionStorage.getItem(`member_${memberId}`)
        if (memberDataStr) {
          const memberData = JSON.parse(memberDataStr)
          setMember(memberData)
        }
        
        // Récupérer toutes les équipes avec leurs membres
        const allTeams = await getTeamsWithMembers()
        
        console.log('=== DEBUG ÉQUIPES ===')
        console.log('Toutes les équipes:', allTeams)
        console.log('Member ID:', memberId)
        
        // Trouver les équipes du membre
        const userTeams = allTeams.filter((team: Team) => 
          team.members && team.members.some((m: any) => 
            (typeof m === 'string' && m === memberId) || 
            (m && typeof m === 'object' && m.id === memberId)
          )
        )
        
        console.log('Équipes du membre:', userTeams)
        
        // Chercher la team "Manager" dans toutes les équipes
        const managerTeam = allTeams.find((team: Team) => 
          team.name && (
            team.name.toLowerCase() === 'manager' || 
            team.name.toLowerCase() === 'team manager' ||
            team.name.toLowerCase().includes('manager')
          )
        )
        
        console.log('Team Manager trouvée:', managerTeam)
        
        // Vérifier si le membre est dans la team Manager
        const isManager = managerTeam && managerTeam.members && managerTeam.members.some((m: any) => 
          (typeof m === 'string' && m === memberId) || 
          (m && typeof m === 'object' && m.id === memberId)
        )
        
        console.log('Est manager?', isManager)
        
        // Si c'est un manager, utiliser les horaires de la team Manager
        // Sinon, utiliser les horaires de sa propre équipe
        const selectedTeam = isManager ? managerTeam : (userTeams[0] || null)
        
        console.log('Équipe sélectionnée:', selectedTeam)
        
        setMemberTeam(selectedTeam)
        
        // Récupérer les pointages de la semaine en cours
        const now = new Date()
        const dayOfWeek = now.getDay() || 7 // Dimanche = 7
        const monday = new Date(now)
        monday.setDate(now.getDate() - (dayOfWeek - 1))
        monday.setHours(0, 0, 0, 0)
        
        const clocks = await getClocks(memberId!, monday, now)
        setTimestamps(clocks)
        
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [memberId])
  
  // Calculer les heures travaillées par jour
  const dailyHours = useMemo(() => computeDailyHours(timestamps), [timestamps])
  
  // Calculer le total de la semaine
  const weekTotal = useMemo(() => {
    return dailyHours.reduce((sum, day) => sum + day.hours, 0)
  }, [dailyHours])
  
  // Jours de la semaine en cours
  const weekDays = useMemo(getCurrentWeekDays, [])
  
  // Calculer les retards pour chaque jour
  const delays = useMemo(() => {
    const result: { [key: string]: { status: string, minutes: number | null } } = {}
    const expectedHour = memberTeam?.startHour ?? 9
    
    console.log('=== DEBUG RETARDS ===')
    console.log('Équipe utilisée:', memberTeam?.name)
    console.log('Heure de début attendue:', expectedHour)
    console.log('memberTeam complet:', memberTeam)
    
    weekDays.forEach(day => {
      result[day] = calculateDelay(timestamps, day, expectedHour)
    })
    
    return result
  }, [timestamps, weekDays, memberTeam])
  
  // Calculer les statistiques
  const stats = useMemo(() => {
    const statuses = Object.values(delays).map(d => d.status)
    return {
      late: statuses.filter(s => s === 'late').length,
      onTime: statuses.filter(s => s === 'on_time').length,
      early: statuses.filter(s => s === 'early').length,
      absent: statuses.filter(s => s === 'absent').length
    }
  }, [delays])
  
  // Formater le texte de retard
  const formatDelayText = (delayInfo: { status: string, minutes: number | null }) => {
    if (!delayInfo) return 'N/A'
    
    const formatMinutesToHM = (totalMinutes: number) => {
      const absMinutes = Math.abs(totalMinutes)
      const hours = Math.floor(absMinutes / 60)
      const minutes = absMinutes % 60
      
      if (hours > 0 && minutes > 0) {
        return `${hours}h${minutes.toString().padStart(2, '0')}`
      } else if (hours > 0) {
        return `${hours}h`
      } else {
        return `${minutes}min`
      }
    }
    
    switch (delayInfo.status) {
      case 'late':
        return `En retard de ${formatMinutesToHM(delayInfo.minutes || 0)}`
      case 'early':
        return `En avance de ${formatMinutesToHM(delayInfo.minutes || 0)}`
      case 'on_time':
        return 'À l\'heure'
      case 'absent':
        return 'Absent'
      case 'future':
        return 'À venir'
      default:
        return 'N/A'
    }
  }
  
  // Couleur du badge de statut
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'late': return 'bg-red-500 text-white'
      case 'early': return 'bg-green-500 text-white'
      case 'on_time': return 'bg-blue-500 text-white'
      case 'absent': return 'bg-gray-400 text-white'
      case 'future': return 'bg-gray-300 text-gray-600'
      default: return 'bg-gray-400 text-white'
    }
  }

  if (loading) {
    return (
      <Shell>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500"></div>
        </div>
      </Shell>
    )
  }

  return (
    <Shell>
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Bouton retour */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-sm text-gray-600 hover:text-yellow-600 transition-colors mb-6"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Retour au Dashboard
        </button>

        {/* En-tête avec infos du membre */}
        <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-xl p-6 mb-6 border border-yellow-200">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {member?.firstName} {member?.lastName}
              </h1>
              <p className="text-gray-600">{member?.email}</p>
              {memberTeam && (
                <div className="mt-3 inline-block bg-white px-3 py-1 rounded-full text-sm">
                  <span className="font-semibold">Équipe:</span> {memberTeam.name} • {formatHoursToHHMM(memberTeam.startHour)} - {formatHoursToHHMM(memberTeam.endHour)}
                </div>
              )}
            </div>
            
            <div className="text-right">
              <div className="text-sm text-gray-500 mb-1">Semaine du {new Date(weekDays[0]).toLocaleDateString('fr-FR')}</div>
              <div className="text-4xl font-bold text-yellow-600">
                {formatHoursToHHMM(weekTotal)}
              </div>
              <div className="text-sm text-gray-500">sur 35h</div>
            </div>
          </div>
        </div>

        {/* Statistiques de présence */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          <div className="glass">
            <div className="px-3 py-2">
              <div className="text-xs font-medium text-gray-600 mb-2">À l'heure</div>
              <div className="text-center">
                <div className="text-xl font-bold text-blue-600">{stats.onTime}</div>
                <div className="text-xs text-gray-500">jours</div>
              </div>
            </div>
          </div>
          
          <div className="glass">
            <div className="px-3 py-2">
              <div className="text-xs font-medium text-gray-600 mb-2">En retard</div>
              <div className="text-center">
                <div className="text-xl font-bold text-red-600">{stats.late}</div>
                <div className="text-xs text-gray-500">jours</div>
              </div>
            </div>
          </div>
          
          <div className="glass">
            <div className="px-3 py-2">
              <div className="text-xs font-medium text-gray-600 mb-2">En avance</div>
              <div className="text-center">
                <div className="text-xl font-bold text-green-600">{stats.early}</div>
                <div className="text-xs text-gray-500">jours</div>
              </div>
            </div>
          </div>
          
          <div className="glass">
            <div className="px-3 py-2">
              <div className="text-xs font-medium text-gray-600 mb-2">Absences</div>
              <div className="text-center">
                <div className="text-xl font-bold text-gray-400">{stats.absent}</div>
                <div className="text-xs text-gray-500">jours</div>
              </div>
            </div>
          </div>
        </div>

        {/* Détail par jour */}
        <Card title="Détail de la semaine">
          <div className="space-y-3">
            {weekDays.map(day => {
              const dayData = dailyHours.find(d => d.day === day)
              const hours = dayData?.hours || 0
              const date = new Date(day)
              const dayName = date.toLocaleDateString('fr-FR', { weekday: 'long' })
              const dayMonth = date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })
              const delayInfo = delays[day]
              const isToday = day === new Date().toISOString().split('T')[0]
              
              return (
                <div 
                  key={day} 
                  className={`flex items-center justify-between p-4 rounded-lg border ${
                    isToday ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold ${
                      isToday ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'
                    }`}>
                      {dayName.substring(0, 3).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 capitalize">{dayName}</div>
                      <div className="text-sm text-gray-500">{dayMonth}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <div className="text-xs text-gray-500 mb-1">Heures travaillées</div>
                      <div className="text-lg font-bold text-gray-900">{formatHoursToHHMM(hours)}</div>
                    </div>
                    
                    <div className="w-px h-12 bg-gray-300"></div>
                    
                    <div className="min-w-[180px]">
                      <span className={`inline-block px-3 py-1.5 rounded text-xs font-medium ${getStatusBadgeClass(delayInfo?.status)}`}>
                        {formatDelayText(delayInfo)}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      </div>
    </Shell>
  )
}
