import { useEffect, useState } from 'react'
import { Shell, Card } from '../components/Layout'
import { useAuth } from '../context/AuthContext'
import { getMyLeavePeriods, createLeavePeriod, deleteLeavePeriod } from '../utils/api'
import { LeavePeriod } from '../utils/types'

export default function LeaveRequestPage() {
  const { user } = useAuth()
  const [leavePeriods, setLeavePeriods] = useState<LeavePeriod[]>([])
  const [loading, setLoading] = useState(true)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth())
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())

  useEffect(() => {
    loadLeavePeriods()
  }, [])

  async function loadLeavePeriods() {
    try {
      setLoading(true)
      const periods = await getMyLeavePeriods()
      setLeavePeriods(periods)
      setError(null)
    } catch (err: any) {
      console.error('Erreur lors du chargement des périodes:', err)
      setError(err.message || 'Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!startDate || !endDate) {
      setError('Veuillez sélectionner les dates de début et de fin')
      return
    }

    const start = new Date(startDate)
    const end = new Date(endDate)

    if (end <= start) {
      setError('La date de fin doit être après la date de début')
      return
    }

    // Vérifier les chevauchements avec les demandes existantes
    const hasOverlap = leavePeriods.some(period => {
      const periodStart = new Date(period.startDate)
      const periodEnd = new Date(period.endDate)
      // Le backend ajoute +1 jour, on le soustrait
      periodEnd.setDate(periodEnd.getDate() - 1)
      
      // Vérifier si les périodes se chevauchent
      return (start <= periodEnd && end >= periodStart)
    })

    if (hasOverlap) {
      setError('Ces dates se chevauchent avec une demande existante (en attente ou validée)')
      return
    }

    try {
      setSubmitting(true)
      setError(null)
      await createLeavePeriod(start, end)
      setStartDate('')
      setEndDate('')
      await loadLeavePeriods()
    } catch (err: any) {
      console.error('Erreur lors de la création:', err)
      setError(err.message || 'Erreur lors de la création de la demande')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(leaveId: string) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette demande ?')) return

    try {
      await deleteLeavePeriod(leaveId)
      await loadLeavePeriods()
    } catch (err: any) {
      console.error('Erreur lors de la suppression:', err)
      setError(err.message || 'Erreur lors de la suppression')
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

  // Créer un calendrier visuel
  function renderCalendar() {
    const today = new Date()
    
    // Obtenir le premier et dernier jour du mois
    const firstDay = new Date(currentYear, currentMonth, 1)
    const lastDay = new Date(currentYear, currentMonth + 1, 0)
    
    // Obtenir le jour de la semaine du premier jour (0 = dimanche)
    const firstDayOfWeek = firstDay.getDay()
    
    const days = []
    const daysInMonth = lastDay.getDate()
    
    // Ajouter les jours vides au début
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(null)
    }
    
    // Ajouter tous les jours du mois
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day)
    }

    function getDayStatus(day: number) {
      const date = new Date(currentYear, currentMonth, day)
      date.setHours(0, 0, 0, 0)
      
      for (const period of leavePeriods) {
        const start = new Date(period.startDate)
        const end = new Date(period.endDate)
        start.setHours(0, 0, 0, 0)
        end.setHours(0, 0, 0, 0)
        // Le backend ajoute +1 jour, on le soustrait pour la comparaison
        end.setDate(end.getDate() - 1)
        
        if (date >= start && date <= end) {
          if (period.accepted === true) return 'validated'
          return 'pending'
        }
      }
      return null
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
            
            const status = getDayStatus(day)
            const isToday = day === today.getDate() && 
                           currentMonth === today.getMonth() && 
                           currentYear === today.getFullYear()
            const isHolidayDay = isHoliday(day, currentMonth, currentYear)
            
            let bgColor = 'transparent'
            let borderColor = 'rgba(255, 212, 0, 0.2)'
            let textColor = 'inherit'
            
            if (isHolidayDay) {
              bgColor = 'rgba(239, 68, 68, 0.08)'
              borderColor = 'rgba(239, 68, 68, 0.3)'
              textColor = 'rgb(239, 68, 68)'
            }
            
            if (status === 'validated') {
              bgColor = 'rgba(34, 197, 94, 0.15)'
              borderColor = 'rgba(34, 197, 94, 0.4)'
            } else if (status === 'pending') {
              bgColor = 'rgba(255, 212, 0, 0.15)'
              borderColor = 'rgba(255, 212, 0, 0.4)'
            }
            
            return (
              <div
                key={day}
                className="aspect-square flex items-center justify-center rounded-md border text-sm transition-all"
                style={{ 
                  background: bgColor,
                  borderColor: isToday ? 'rgba(255, 212, 0, 0.6)' : borderColor,
                  fontWeight: isToday ? 'bold' : 'normal',
                  color: isHolidayDay && !status ? textColor : 'inherit'
                }}
              >
                {day}
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

  return (
    <Shell>
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="page-title text-center mb-8">Mes demandes de vacances</h1>

        <Card title="Nouvelle demande">
          {error && (
            <div className="mb-4 p-4 rounded-lg" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
              <p style={{ color: 'rgb(239, 68, 68)' }}>{error}</p>
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label mb-2">Date de début</label>
                <input
                  type="date"
                  className="input w-full"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="label mb-2">Date de fin</label>
                <input
                  type="date"
                  className="input w-full"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              className="btn-primary w-full"
              disabled={submitting}
            >
              {submitting ? 'Envoi en cours...' : 'Envoyer la demande'}
            </button>
          </form>
        </Card>

        <Card title="Mes demandes">
          {leavePeriods.filter(period => new Date(period.endDate) >= new Date()).length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4"></div>
              <p className="text-lg subtle">Aucune demande de vacances pour le moment.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {leavePeriods
                .filter(period => new Date(period.endDate) >= new Date())
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .map(period => (
                  <div
                    key={period.id}
                    className="p-6 rounded-2xl border-2"
                    style={{ borderColor: 'rgba(255, 212, 0, 0.2)' }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-lg font-bold">
                            {formatDate(period.startDate)} → {formatDate(period.endDate, true)}
                          </h3>
                          {getStatusBadge(period)}
                        </div>
                        <p className="text-sm subtle">
                          Durée: {getDaysBetween(period.startDate, period.endDate)} jour(s)
                        </p>
                        <p className="text-sm subtle mt-1">
                          Demandé le {formatDate(period.createdAt)}
                        </p>
                      </div>
                      {period.accepted === false && (
                        <button
                          onClick={() => handleDelete(period.id)}
                          className="px-4 py-2 rounded-lg text-sm font-semibold transition-all"
                          style={{ 
                            background: 'rgba(239, 68, 68, 0.1)', 
                            color: 'rgb(239, 68, 68)',
                            border: '1px solid rgba(239, 68, 68, 0.3)'
                          }}
                        >
                          Supprimer
                        </button>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </Card>

        <Card title="Calendrier du mois">
          {renderCalendar()}
        </Card>
      </div>
    </Shell>
  )
}
