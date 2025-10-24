import React, { useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Shell, Card } from '../components/Layout'
import { getClocks, getTeamsWithMembers, updateClockForMember, deleteClockForMember, addClockForMember, getDaysOffForUser } from '../utils/api'
import { ConfirmModal } from '../components/ConfirmModal'

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

interface ClockPair {
  clockIn: Date
  clockOut: Date | null
  day: string
  clockInOriginal?: Date  // Pour stocker la date originale exacte
  clockOutOriginal?: Date // Pour stocker la date originale exacte
  clockInISO?: string     // Pour stocker le string ISO original
  clockOutISO?: string    // Pour stocker le string ISO original
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
  const [timestamps, setTimestamps] = useState<Array<{ date: Date, iso: string }>>([])
  const [memberTeam, setMemberTeam] = useState<Team | null>(null)
  const [loading, setLoading] = useState(true)
  const [editingClock, setEditingClock] = useState<ClockPair | null>(null)
  const [deletingClock, setDeletingClock] = useState<Date | null>(null)
  const [editClockInTime, setEditClockInTime] = useState('')
  const [editClockOutTime, setEditClockOutTime] = useState('')
  const [daysOff, setDaysOff] = useState<string[]>([])
  const [confirmDeleteModalOpen, setConfirmDeleteModalOpen] = useState(false)
  const [pendingDeletePair, setPendingDeletePair] = useState<ClockPair | null>(null)

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

        const daysOff = await getDaysOffForUser(memberId!, monday.toISOString().slice(0, 10), now.toISOString().slice(0, 10));
        setDaysOff(daysOff);

      } catch (error) {
        console.error('Erreur lors du chargement des données:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [memberId])
  
  // Calculer les heures travaillées par jour
  const dailyHours = useMemo(() => computeDailyHours(timestamps.map(t => t.date)), [timestamps])
  
  // Calculer le total de la semaine
  const weekTotal = useMemo(() => {
    return dailyHours.reduce((sum, day) => sum + day.hours, 0)
  }, [dailyHours])
  
  // Jours de la semaine en cours
  const weekDays = useMemo(getCurrentWeekDays, [])
  
  // Regrouper les pointages par paires (arrivée/départ)
  const clockPairsByDay = useMemo(() => {
    const byDay: { [key: string]: Array<{ date: Date, iso: string }> } = {}
    
    for (const ts of timestamps) {
      const day = ts.date.toISOString().slice(0, 10)
      if (!byDay[day]) byDay[day] = []
      byDay[day].push(ts)
    }
    
    const result: { [key: string]: ClockPair[] } = {}
    
    for (const [day, times] of Object.entries(byDay)) {
      const sorted = times.sort((a, b) => a.date.getTime() - b.date.getTime())
      const pairs: ClockPair[] = []
      
      for (let i = 0; i < sorted.length; i += 2) {
        pairs.push({
          clockIn: sorted[i].date,
          clockOut: sorted[i + 1]?.date || null,
          day,
          clockInOriginal: sorted[i].date,
          clockOutOriginal: sorted[i + 1]?.date || null,
          clockInISO: sorted[i].iso,
          clockOutISO: sorted[i + 1]?.iso || undefined
        })
      }
      
      result[day] = pairs
    }
    
    return result
  }, [timestamps])
  
  // Fonction pour recharger les données
  const reloadClocks = async () => {
    if (!memberId) return
    try {
      const now = new Date()
      const dayOfWeek = now.getDay() || 7
      const monday = new Date(now)
      monday.setDate(now.getDate() - (dayOfWeek - 1))
      monday.setHours(0, 0, 0, 0)
      
      const clocks = await getClocks(memberId, monday, now)
      setTimestamps(clocks)
    } catch (error) {
      console.error('Erreur lors du rechargement des pointages:', error)
    }
  }
  
  // Fonction pour modifier un pointage
  const handleUpdateClock = async () => {
    if (!editingClock || !memberId) return
    
    try {
      const [inHours, inMinutes] = editClockInTime.split(':').map(Number)
      const originalDate = new Date(editingClock.clockIn)
      const year = originalDate.getFullYear()
      const month = originalDate.getMonth()
      const day = originalDate.getDate()
      const newClockIn = new Date(year, month, day, inHours, inMinutes, 0, 0)
      
      // Vérifier si c'est un nouveau pointage en vérifiant si le clockIn existe dans les timestamps
      const isNewClock = !timestamps.some(t => 
        Math.abs(t.date.getTime() - editingClock.clockIn.getTime()) < 2000
      )
      
      if (isNewClock) {
        // Créer un nouveau pointage
        await addClockForMember(memberId, newClockIn)
        
        if (editClockOutTime) {
          const [outHours, outMinutes] = editClockOutTime.split(':').map(Number)
          const newClockOut = new Date(year, month, day, outHours, outMinutes, 0, 0)
          await addClockForMember(memberId, newClockOut)
        }
      } else {
        // Modifier un pointage existant
        await updateClockForMember(memberId, editingClock.clockIn.toISOString(), newClockIn)
        
        if (editingClock.clockOut && editClockOutTime) {
          const [outHours, outMinutes] = editClockOutTime.split(':').map(Number)
          const originalOutDate = new Date(editingClock.clockOut)
          const outYear = originalOutDate.getFullYear()
          const outMonth = originalOutDate.getMonth()
          const outDay = originalOutDate.getDate()
          const newClockOut = new Date(outYear, outMonth, outDay, outHours, outMinutes, 0, 0)
          
          await updateClockForMember(memberId, editingClock.clockOut.toISOString(), newClockOut)
        }
      }
      
      await reloadClocks()
      setEditingClock(null)
      setEditClockInTime('')
      setEditClockOutTime('')
    } catch (error) {
      console.error('Erreur:', error)
    }
  }
  
  // Fonction pour supprimer un pointage
  const handleDeleteClock = async (clockToDelete: Date) => {
    if (!memberId) return
    
    try {
      await deleteClockForMember(memberId, clockToDelete)
      await reloadClocks()
      setDeletingClock(null)
    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
    }
  }
  
  // Fonction pour supprimer une paire complète
  const handleDeleteClick = (pair: ClockPair) => {
    setPendingDeletePair(pair)
    setConfirmDeleteModalOpen(true)
  }

  const confirmDelete = async () => {
    if (!memberId || !pendingDeletePair) return
    
    try {
      await deleteClockForMember(memberId, pendingDeletePair.clockIn.toISOString())
      if (pendingDeletePair.clockOut) {
        await deleteClockForMember(memberId, pendingDeletePair.clockOut.toISOString())
      }
      await reloadClocks()
      setPendingDeletePair(null)
    } catch (err) {
      console.error('Erreur lors de la suppression:', err)
    }
  }
  
  // Fonction pour ouvrir le modal d'édition
  const openEditModal = (pair: ClockPair) => {
    console.log('openEditModal appelé', pair)
    console.log('clockInISO:', pair.clockInISO)
    console.log('clockOutISO:', pair.clockOutISO)
    setEditingClock(pair)
    const clockInTime = pair.clockIn.toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false
    })
    setEditClockInTime(clockInTime)
    
    if (pair.clockOut) {
      const clockOutTime = pair.clockOut.toLocaleTimeString('fr-FR', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false
      })
      setEditClockOutTime(clockOutTime)
    } else {
      setEditClockOutTime('')
    }
  }
  
  // Calculer les retards pour chaque jour
  const delays = useMemo(() => {
    const result: { [key: string]: { status: string, minutes: number | null } } = {}
    const expectedHour = memberTeam?.startHour ?? 9
    
    console.log('=== DEBUG RETARDS ===')
    console.log('Équipe utilisée:', memberTeam?.name)
    console.log('Heure de début attendue:', expectedHour)
    console.log('memberTeam complet:', memberTeam)
    
    weekDays.forEach(day => {
      result[day] = calculateDelay(timestamps.map(t => t.date), day, expectedHour)
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
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center py-20">
            <div className="spinner mb-4"></div>
            <p className="subtle">Chargement des détails du membre...</p>
          </div>
        </div>
      </Shell>
    )
  }

  const workingDaysCount = weekDays.filter(d => !daysOff.includes(d)).length
  const weekHoursTarget = memberTeam ? (memberTeam.endHour - memberTeam.startHour) * workingDaysCount : 0

  return (
    <Shell>
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Navigation */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center text-sm text-gray-600 hover:text-yellow-600 transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Retour au Dashboard
          </button>

          <button
            onClick={() => navigate(`/member/${memberId}/summary`)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Pour regarder les résumés
          </button>
        </div>

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
              <div className="text-sm text-gray-500">sur {formatHoursToHHMM(weekHoursTarget)}h</div>
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
              const pairs = clockPairsByDay[day] || []
              const isDayOff = daysOff.includes(day);

              return (
                <div key={day} className="space-y-2">
                  <div 
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
                      {isDayOff ? (
                        <div className="text-right">
                          <div className="text-sm text-purple-600 font-semibold">Jour de repos</div>
                        </div>
                      ) : 
                        <div className="text-right">
                          <div className="text-xs text-gray-500 mb-1">Heures travaillées</div>
                          <div className="text-lg font-bold text-gray-900">{formatHoursToHHMM(hours)}</div>
                        </div>
                      }
                      
                      <div className="w-px h-12 bg-gray-300"></div>
                      
                      <div className="min-w-[180px]">
                        {isDayOff ? null : 
                          <span className={`inline-block px-3 py-1.5 rounded text-xs font-medium ${getStatusBadgeClass(delayInfo?.status)}`}>
                            {formatDelayText(delayInfo)}
                          </span>
                        }
                      </div>
                    </div>
                  </div>
                  
                  {/* Afficher les paires de pointages */}
                  {isDayOff ? null : 
                    <div className="ml-16 space-y-2">
                      {pairs.length > 0 && (
                        <>
                          {pairs.map((pair, idx) => (
                            <div key={idx} className="flex items-center justify-between bg-white border border-gray-200 rounded-lg p-3">
                              <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                                  </svg>
                                  <span className="font-medium text-gray-900">
                                    {pair.clockIn.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', hour12: false })}
                                  </span>
                                </div>
                                
                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                </svg>
                                
                                <div className="flex items-center gap-2">
                                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                  </svg>
                                  <span className="font-medium text-gray-900">
                                    {pair.clockOut ? pair.clockOut.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', hour12: false }) : 'En cours...'}
                                  </span>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => openEditModal(pair)}
                                  className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-lg transition-colors flex items-center gap-1"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                  Modifier
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteClick(pair)}
                                  className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-sm rounded-lg transition-colors flex items-center gap-1"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                  Supprimer
                                </button>
                              </div>
                            </div>
                          ))}
                        </>
                      )}
                      
                      {/* Bouton pour ajouter un pointage - toujours visible */}
                      <button
                        type="button"
                        onClick={() => {
                          const currentDay = day
                          const date = new Date(currentDay)
                          const defaultClockIn = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 9, 0, 0, 0)
                          const defaultClockOut = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 17, 0, 0, 0)
                          openEditModal({
                            clockIn: defaultClockIn,
                            clockOut: defaultClockOut,
                            day: currentDay,
                            clockInOriginal: defaultClockIn,
                            clockOutOriginal: defaultClockOut,
                            clockInISO: defaultClockIn.toISOString(),
                            clockOutISO: defaultClockOut.toISOString()
                          })
                        }}
                        className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm rounded-lg transition-colors flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Ajouter un pointage
                      </button>
                    </div>
                  }
                </div>
              )
            })}
          </div>
        </Card>
        
        {/* Modal d'édition */}
        {editingClock && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Modifier les horaires</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Heure d'arrivée
                  </label>
                  <input
                    type="time"
                    value={editClockInTime}
                    onChange={(e) => setEditClockInTime(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                {editingClock.clockOut && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Heure de départ
                    </label>
                    <input
                      type="time"
                      value={editClockOutTime}
                      onChange={(e) => setEditClockOutTime(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                )}
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setEditingClock(null)
                    setEditClockInTime('')
                    setEditClockOutTime('')
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleUpdateClock}
                  className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                >
                  Enregistrer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={confirmDeleteModalOpen}
        onClose={() => {
          setConfirmDeleteModalOpen(false)
          setPendingDeletePair(null)
        }}
        onConfirm={confirmDelete}
        title="Supprimer le pointage"
        message="Êtes-vous sûr de vouloir supprimer ce pointage ? Cette action est irréversible."
        confirmText="Supprimer"
        cancelText="Annuler"
        danger={true}
      />
    </Shell>
  )
}
