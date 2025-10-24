import { useEffect, useState } from 'react'
import { Shell, Card } from '../components/Layout'
import { useAuth } from '../context/AuthContext'
import { getMyTeams, getTeamMembersLeavePeriods, updateLeavePeriodStatus, deleteUserLeavePeriod } from '../utils/api'
import { LeavePeriod, User } from '../utils/types'
import { ConfirmModal } from '../components/ConfirmModal'

type LeavePeriodWithUser = LeavePeriod & {
  user: User
}

export default function LeaveValidationPage() {
  const { user } = useAuth()
  const [leavePeriods, setLeavePeriods] = useState<LeavePeriodWithUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null)
  const [teams, setTeams] = useState<any[]>([])
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth())
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
  const [showPending, setShowPending] = useState(true)
  const [showValidated, setShowValidated] = useState(false)
  const [confirmRejectModalOpen, setConfirmRejectModalOpen] = useState(false)
  const [confirmValidateModalOpen, setConfirmValidateModalOpen] = useState(false)
  const [confirmCancelModalOpen, setConfirmCancelModalOpen] = useState(false)
  const [pendingReject, setPendingReject] = useState<{ userId: string, leaveId: string } | null>(null)
  const [pendingValidate, setPendingValidate] = useState<{ userId: string, leaveId: string } | null>(null)
  const [pendingCancel, setPendingCancel] = useState<{ userId: string, leaveId: string } | null>(null)

  useEffect(() => {
    loadTeamsAndPeriods()
  }, [])

  async function loadTeamsAndPeriods() {
    try {
      setLoading(true)
      const teamsData = await getMyTeams()
      const teamsList = Array.isArray(teamsData) ? teamsData : (teamsData && teamsData.team ? [teamsData] : [])
      
      // Filtrer uniquement les équipes où l'utilisateur est manager
      const managerTeams = teamsList.filter((t: any) => t.team.managerId === user?.id)
      
      setTeams(managerTeams)
      
      if (managerTeams.length > 0) {
        const firstTeamId = managerTeams[0].team.id
        setSelectedTeamId(firstTeamId)
        await loadLeavePeriods(firstTeamId)
      } else {
        setError('Vous n\'êtes manager d\'aucune équipe')
        setLoading(false)
      }
    } catch (err: any) {
      console.error('Erreur lors du chargement:', err)
      setError(err.message || 'Erreur lors du chargement')
      setLoading(false)
    }
  }

  async function loadLeavePeriods(teamId: string) {
    try {
      setLoading(true)
      const periods = await getTeamMembersLeavePeriods(teamId)
      setLeavePeriods(periods)
      setError(null)
    } catch (err: any) {
      console.error('Erreur lors du chargement des périodes:', err)
      setError(err.message || 'Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }

  function handleValidateClick(userId: string, leaveId: string) {
    setPendingValidate({ userId, leaveId })
    setConfirmValidateModalOpen(true)
  }

  async function confirmValidate() {
    if (!pendingValidate) return
    
    try {
      await updateLeavePeriodStatus(pendingValidate.userId, pendingValidate.leaveId, true)
      if (selectedTeamId) {
        await loadLeavePeriods(selectedTeamId)
      }
      setPendingValidate(null)
    } catch (err: any) {
      console.error('Erreur lors de la validation:', err)
      setError(err.message || 'Erreur lors de la validation')
    }
  }

  function handleRejectClick(userId: string, leaveId: string) {
    setPendingReject({ userId, leaveId })
    setConfirmRejectModalOpen(true)
  }

  async function confirmReject() {
    if (!pendingReject) return
    
    try {
      await deleteUserLeavePeriod(pendingReject.userId, pendingReject.leaveId)
      if (selectedTeamId) {
        await loadLeavePeriods(selectedTeamId)
      }
      setPendingReject(null)
    } catch (err: any) {
      console.error('Erreur lors du refus:', err)
      setError(err.message || 'Erreur lors du refus')
    }
  }

  function handleCancelClick(userId: string, leaveId: string) {
    setPendingCancel({ userId, leaveId })
    setConfirmCancelModalOpen(true)
  }

  async function confirmCancel() {
    if (!pendingCancel) return
    
    try {
      await deleteUserLeavePeriod(pendingCancel.userId, pendingCancel.leaveId)
      if (selectedTeamId) {
        await loadLeavePeriods(selectedTeamId)
      }
      setPendingCancel(null)
    } catch (err: any) {
      console.error('Erreur lors de l\'annulation:', err)
      setError(err.message || 'Erreur lors de l\'annulation')
    }
  }

  function getStatusBadge(period: LeavePeriod) {
    if (period.accepted === true) {
      return (
        <span className="inline-block px-3 py-1 text-sm font-semibold rounded-full"
              style={{ background: 'rgba(34, 197, 94, 0.2)', color: 'rgb(34, 197, 94)' }}>
          Validée
        </span>
      )
    } else {
      return (
        <span className="inline-block px-3 py-1 text-sm font-semibold rounded-full"
              style={{ background: 'rgba(255, 212, 0, 0.2)', color: 'hsl(var(--ink))' }}>
          En attente
        </span>
      )
    }
  }

  function formatDate(dateStr: string, isEndDate: boolean = false) {
    const date = new Date(dateStr)
    // Le backend ajoute +1 jour à la date de fin, on soustrait pour l'affichage
    if (isEndDate) {
      date.setDate(date.getDate() - 1)
    }
    return date.toLocaleDateString('fr-FR', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  function getDaysBetween(start: string, end: string) {
    const startDate = new Date(start)
    const endDate = new Date(end)
    // Le backend ajoute +1 jour, on le soustrait pour le calcul
    endDate.setDate(endDate.getDate() - 1)
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1 // +1 pour inclure le jour de début
    return diffDays
  }

  // Fonction pour calculer les jours fériés français
  function getFrenchHolidays(year: number): Date[] {
    const holidays: Date[] = []
    
    // Jours fixes
    holidays.push(new Date(year, 0, 1))   // Jour de l'an
    holidays.push(new Date(year, 4, 1))   // Fête du travail
    holidays.push(new Date(year, 4, 8))   // Victoire 1945
    holidays.push(new Date(year, 6, 14))  // Fête nationale
    holidays.push(new Date(year, 7, 15))  // Assomption
    holidays.push(new Date(year, 10, 1))  // Toussaint
    holidays.push(new Date(year, 10, 11)) // Armistice 1918
    holidays.push(new Date(year, 11, 25)) // Noël
    
    // Calcul de Pâques (algorithme de Meeus)
    const a = year % 19
    const b = Math.floor(year / 100)
    const c = year % 100
    const d = Math.floor(b / 4)
    const e = b % 4
    const f = Math.floor((b + 8) / 25)
    const g = Math.floor((b - f + 1) / 3)
    const h = (19 * a + b - d - g + 15) % 30
    const i = Math.floor(c / 4)
    const k = c % 4
    const l = (32 + 2 * e + 2 * i - h - k) % 7
    const m = Math.floor((a + 11 * h + 22 * l) / 451)
    const month = Math.floor((h + l - 7 * m + 114) / 31) - 1
    const day = ((h + l - 7 * m + 114) % 31) + 1
    
    const easter = new Date(year, month, day)
    
    // Lundi de Pâques (Pâques + 1 jour)
    const easterMonday = new Date(easter)
    easterMonday.setDate(easter.getDate() + 1)
    holidays.push(easterMonday)
    
    // Ascension (Pâques + 39 jours)
    const ascension = new Date(easter)
    ascension.setDate(easter.getDate() + 39)
    holidays.push(ascension)
    
    // Lundi de Pentecôte (Pâques + 50 jours)
    const pentecost = new Date(easter)
    pentecost.setDate(easter.getDate() + 50)
    holidays.push(pentecost)
    
    return holidays
  }

  function isHoliday(day: number, month: number, year: number): boolean {
    const date = new Date(year, month, day)
    const holidays = getFrenchHolidays(year)
    
    return holidays.some(holiday => 
      holiday.getDate() === day && 
      holiday.getMonth() === month && 
      holiday.getFullYear() === year
    )
  }

  function handlePreviousMonth() {
    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear(currentYear - 1)
    } else {
      setCurrentMonth(currentMonth - 1)
    }
  }

  function handleNextMonth() {
    const today = new Date()
    const maxDate = new Date(today.getFullYear() + 1, today.getMonth(), 1)
    const nextMonthDate = new Date(currentYear, currentMonth + 1, 1)
    
    if (nextMonthDate < maxDate) {
      if (currentMonth === 11) {
        setCurrentMonth(0)
        setCurrentYear(currentYear + 1)
      } else {
        setCurrentMonth(currentMonth + 1)
      }
    }
  }

  function canGoNext() {
    const today = new Date()
    const maxDate = new Date(today.getFullYear() + 1, today.getMonth(), 1)
    const nextMonthDate = new Date(currentYear, currentMonth + 1, 1)
    return nextMonthDate < maxDate
  }

  // Créer un calendrier visuel pour l'équipe
  function renderTeamCalendar() {
    const today = new Date()
    
    const firstDay = new Date(currentYear, currentMonth, 1)
    const lastDay = new Date(currentYear, currentMonth + 1, 0)
    const firstDayOfWeek = firstDay.getDay()
    
    const days = []
    const daysInMonth = lastDay.getDate()
    
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(null)
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day)
    }

    function getDayPeriods(day: number) {
      const date = new Date(currentYear, currentMonth, day)
      date.setHours(0, 0, 0, 0)
      
      const periodsOnDay: LeavePeriodWithUser[] = []
      
      for (const period of leavePeriods) {
        const start = new Date(period.startDate)
        const end = new Date(period.endDate)
        start.setHours(0, 0, 0, 0)
        end.setHours(0, 0, 0, 0)
        // Le backend ajoute +1 jour, on le soustrait pour la comparaison
        end.setDate(end.getDate() - 1)
        
        if (date >= start && date <= end) {
          periodsOnDay.push(period)
        }
      }
      
      return periodsOnDay
    }

    return (
      <div className="mb-6 max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={handlePreviousMonth}
            className="px-3 py-1.5 text-sm rounded-lg font-semibold transition-all"
            style={{ background: 'rgba(255, 212, 0, 0.1)', border: '1px solid rgba(255, 212, 0, 0.3)' }}
          >
            ← Préc.
          </button>
          <h3 className="text-lg font-bold">
            {firstDay.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
          </h3>
          <button
            onClick={handleNextMonth}
            disabled={!canGoNext()}
            className="px-3 py-1.5 text-sm rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: 'rgba(255, 212, 0, 0.1)', border: '1px solid rgba(255, 212, 0, 0.3)' }}
          >
            Suiv. →
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'].map(day => (
            <div key={day} className="text-center font-semibold text-xs subtle py-1">
              {day}
            </div>
          ))}
          {days.map((day, index) => {
            if (day === null) {
              return <div key={`empty-${index}`} />
            }
            
            const periodsOnDay = getDayPeriods(day)
            const isToday = day === today.getDate() && 
                           currentMonth === today.getMonth() && 
                           currentYear === today.getFullYear()
            const isHolidayDay = isHoliday(day, currentMonth, currentYear)
            
            const hasValidated = periodsOnDay.some(p => p.accepted === true)
            const hasPending = periodsOnDay.some(p => p.accepted === false)
            
            let bgColor = 'transparent'
            let borderColor = 'rgba(255, 212, 0, 0.2)'
            let textColor = 'inherit'
            
            if (isHolidayDay) {
              bgColor = 'rgba(239, 68, 68, 0.08)'
              borderColor = 'rgba(239, 68, 68, 0.3)'
              textColor = 'rgb(239, 68, 68)'
            }
            
            if (hasValidated && hasPending) {
              bgColor = 'linear-gradient(135deg, rgba(34, 197, 94, 0.15) 50%, rgba(255, 212, 0, 0.15) 50%)'
            } else if (hasValidated) {
              bgColor = 'rgba(34, 197, 94, 0.15)'
              borderColor = 'rgba(34, 197, 94, 0.4)'
            } else if (hasPending) {
              bgColor = 'rgba(255, 212, 0, 0.15)'
              borderColor = 'rgba(255, 212, 0, 0.4)'
            }
            
            return (
              <div
                key={day}
                className="aspect-square flex flex-col items-center justify-center rounded-md border transition-all relative group cursor-pointer text-sm"
                style={{ 
                  background: bgColor,
                  borderColor: isToday ? 'rgba(255, 212, 0, 0.6)' : borderColor,
                  fontWeight: isToday ? 'bold' : 'normal',
                  color: isHolidayDay && periodsOnDay.length === 0 ? textColor : 'inherit'
                }}
              >
                <div className="text-xs">{day}</div>
                {periodsOnDay.length > 0 && (
                  <div className="text-[10px] mt-0.5" style={{ color: 'rgba(255, 212, 0, 0.8)' }}>
                    {periodsOnDay.length}
                  </div>
                )}
                {periodsOnDay.length > 0 && (
                  <div className="absolute top-full left-0 mt-2 p-2 rounded-lg shadow-lg z-10 hidden group-hover:block min-w-[200px]"
                       style={{ background: 'hsl(var(--paper))', border: '1px solid rgba(255, 212, 0, 0.3)' }}>
                    {periodsOnDay.map(period => (
                      <div key={period.id} className="text-xs mb-1">
                        <span className="font-semibold">{period.user.firstName} {period.user.lastName}</span>
                        {' - '}
                        {period.accepted === true ? 'Validée' : 'En attente'}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
        <div className="flex justify-center gap-4 mt-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ background: 'rgba(34, 197, 94, 0.3)' }} />
            <span>Validée</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ background: 'rgba(255, 212, 0, 0.3)' }} />
            <span>En attente</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)' }} />
            <span>Jour férié</span>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <Shell>
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center py-20">
            <div className="spinner mb-4"></div>
            <p className="subtle">Chargement...</p>
          </div>
        </div>
      </Shell>
    )
  }

  if (teams.length === 0) {
    return (
      <Shell>
        <div className="max-w-5xl mx-auto px-4 py-8">
          <Card title="Validation des demandes de vacances">
            <div className="text-center py-20">
              <div className="text-6xl mb-6"></div>
              <p className="text-xl subtle">Vous n'êtes manager d'aucune équipe.</p>
            </div>
          </Card>
        </div>
      </Shell>
    )
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const pendingPeriods = leavePeriods.filter(p => p.accepted === false && new Date(p.endDate) >= today)
  const validatedPeriods = leavePeriods.filter(p => p.accepted === true && new Date(p.endDate) >= today)

  return (
    <Shell>
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="page-title text-center mb-8">Validation des demandes de vacances</h1>

        {error && (
          <div className="mb-6 p-4 rounded-lg" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
            <p style={{ color: 'rgb(239, 68, 68)' }}>{error}</p>
          </div>
        )}

        {teams.length > 1 && (
          <div className="mb-8">
            <label className="label mb-2">Sélectionner une équipe</label>
            <select
              className="input max-w-md"
              value={selectedTeamId || ''}
              onChange={(e) => {
                setSelectedTeamId(e.target.value)
                loadLeavePeriods(e.target.value)
              }}
            >
              {teams.map((teamItem) => (
                <option key={teamItem.team.id} value={teamItem.team.id}>
                  {teamItem.team.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <button
            onClick={() => setShowPending(!showPending)}
            className="p-6 rounded-2xl text-center transition-all hover:scale-105 cursor-pointer"
            style={{ background: 'rgba(255, 212, 0, 0.1)', border: showPending ? '2px solid rgba(255, 212, 0, 0.5)' : '2px solid transparent' }}
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="text-4xl font-bold">{pendingPeriods.length}</div>
              <span className="text-2xl">{showPending ? '▼' : '▶'}</span>
            </div>
            <div className="text-sm subtle">En attente</div>
          </button>
          <button
            onClick={() => setShowValidated(!showValidated)}
            className="p-6 rounded-2xl text-center transition-all hover:scale-105 cursor-pointer"
            style={{ background: 'rgba(34, 197, 94, 0.1)', border: showValidated ? '2px solid rgba(34, 197, 94, 0.5)' : '2px solid transparent' }}
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="text-4xl font-bold">{validatedPeriods.length}</div>
              <span className="text-2xl">{showValidated ? '▼' : '▶'}</span>
            </div>
            <div className="text-sm subtle">Validées</div>
          </button>
        </div>

        {showPending && pendingPeriods.length > 0 && (
          <Card title="Demandes en attente">
            <div className="space-y-4">
              {pendingPeriods
                .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
                .map(period => (
                  <div
                    key={period.id}
                    className="p-6 rounded-2xl border-2"
                    style={{ borderColor: 'rgba(255, 212, 0, 0.3)' }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
                               style={{ background: 'linear-gradient(135deg, rgba(255, 212, 0, 0.2), rgba(255, 212, 0, 0.1))' }}>
                          </div>
                          <div>
                            <h3 className="text-lg font-bold">
                              {period.user.firstName} {period.user.lastName}
                            </h3>
                            <p className="text-sm subtle">{period.user.email}</p>
                          </div>
                        </div>
                        <div className="ml-13">
                          <p className="font-semibold mb-1">
                            {formatDate(period.startDate)} → {formatDate(period.endDate, true)}
                          </p>
                          <p className="text-sm subtle">
                            Durée: {getDaysBetween(period.startDate, period.endDate)} jour(s)
                          </p>
                          <p className="text-sm subtle mt-1">
                            Demandé le {formatDate(period.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleValidateClick(period.user_id, period.id)}
                          className="px-4 py-2 rounded-lg text-sm font-semibold transition-all"
                          style={{ 
                            background: 'rgba(34, 197, 94, 0.1)', 
                            color: 'rgb(34, 197, 94)',
                            border: '1px solid rgba(34, 197, 94, 0.3)'
                          }}
                        >
                          Valider
                        </button>
                        <button
                          onClick={() => handleRejectClick(period.user_id, period.id)}
                          className="px-4 py-2 rounded-lg text-sm font-semibold transition-all"
                          style={{ 
                            background: 'rgba(239, 68, 68, 0.1)', 
                            color: 'rgb(239, 68, 68)',
                            border: '1px solid rgba(239, 68, 68, 0.3)'
                          }}
                        >
                          Refuser
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </Card>
        )}

        {showValidated && validatedPeriods.length > 0 && (
          <Card title="Demandes validées">
            <div className="space-y-4">
              {validatedPeriods
                .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
                .map(period => (
                  <div
                    key={period.id}
                    className="p-6 rounded-2xl border-2"
                    style={{ borderColor: 'rgba(34, 197, 94, 0.3)', background: 'rgba(34, 197, 94, 0.05)' }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
                             style={{ background: 'rgba(34, 197, 94, 0.2)' }}>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-bold mb-1">
                            {period.user.firstName} {period.user.lastName}
                          </h3>
                          <p className="font-semibold mb-1">
                            {formatDate(period.startDate)} → {formatDate(period.endDate, true)}
                          </p>
                          <p className="text-sm subtle">
                            Durée: {getDaysBetween(period.startDate, period.endDate)} jour(s)
                          </p>
                        </div>
                        {getStatusBadge(period)}
                      </div>
                      <button
                        onClick={() => handleCancelClick(period.user_id, period.id)}
                        className="px-4 py-2 rounded-lg text-sm font-semibold transition-all"
                        style={{ 
                          background: 'rgba(239, 68, 68, 0.1)', 
                          color: 'rgb(239, 68, 68)',
                          border: '1px solid rgba(239, 68, 68, 0.3)'
                        }}
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </Card>
        )}

        <Card title="Calendrier de l'équipe">
          {renderTeamCalendar()}
        </Card>
      </div>

      <ConfirmModal
        isOpen={confirmValidateModalOpen}
        onClose={() => {
          setConfirmValidateModalOpen(false)
          setPendingValidate(null)
        }}
        onConfirm={confirmValidate}
        title="Valider la demande"
        message="Êtes-vous sûr de vouloir valider cette demande de vacances ?"
        confirmText="Valider"
        cancelText="Annuler"
        danger={false}
      />

      <ConfirmModal
        isOpen={confirmRejectModalOpen}
        onClose={() => {
          setConfirmRejectModalOpen(false)
          setPendingReject(null)
        }}
        onConfirm={confirmReject}
        title="Refuser la demande"
        message="Êtes-vous sûr de vouloir refuser et supprimer définitivement cette demande de vacances ?"
        confirmText="Refuser"
        cancelText="Annuler"
        danger={true}
      />

      <ConfirmModal
        isOpen={confirmCancelModalOpen}
        onClose={() => {
          setConfirmCancelModalOpen(false)
          setPendingCancel(null)
        }}
        onConfirm={confirmCancel}
        title="Annuler la validation"
        message="Êtes-vous sûr de vouloir annuler cette validation et supprimer la demande ? Cette action est irréversible."
        confirmText="Annuler la validation"
        cancelText="Retour"
        danger={true}
      />
    </Shell>
  )
}
