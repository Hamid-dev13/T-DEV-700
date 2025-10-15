import { useEffect, useState } from 'react'
import { Shell, Card } from '../components/Layout'
import { useAuth } from '../context/AuthContext'
import { getUserTeam } from '../utils/api'
import { Team, User } from '../utils/types'

type TeamData = {
  team: Team
  manager: User
  members: User[]
}

export default function TeamManagePage() {
  const { user: me } = useAuth()
  const [activeTab, setActiveTab] = useState<'members' | 'manager'>('members')
  const [allTeams, setAllTeams] = useState<TeamData[]>([])
  const [selectedTeamIndex, setSelectedTeamIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!me) return
    
    getUserTeam()
      .then(data => {
        // La réponse peut être un tableau ou un objet unique
        const teams = Array.isArray(data) ? data : (data && data.team ? [data] : [])
        
        if (teams.length > 0) {
          setAllTeams(teams)
          setSelectedTeamIndex(0)
          setError(null)
        } else {
          setAllTeams([])
          setError('Aucune équipe trouvée pour cet utilisateur')
        }
        setLoading(false)
      })
      .catch(err => {
        console.error('Erreur lors de la récupération des équipes:', err)
        setAllTeams([])
        setError(err.message || 'Erreur lors du chargement des équipes')
        setLoading(false)
      })
  }, [me])

  const teamData = allTeams.length > 0 ? allTeams[selectedTeamIndex] : null

  if (loading) {
    return (
      <Shell>
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center py-20">
            <div className="spinner mb-4"></div>
            <p className="subtle">Chargement de l'équipe...</p>
          </div>
        </div>
      </Shell>
    )
  }

  if (!teamData) {
    return (
      <Shell>
        <div className="max-w-5xl mx-auto px-4 py-8">
          <Card title="👥 Équipe">
            <div className="text-center py-20">
              <div className="text-6xl mb-6">👥</div>
              <p className="text-xl subtle">Vous n'êtes pas encore assigné à une équipe.</p>
            </div>
          </Card>
        </div>
      </Shell>
    )
  }

  const { team, manager, members } = teamData

  return (
    <Shell>
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Sélecteur d'équipe en haut à gauche si plusieurs équipes */}
        {allTeams.length > 1 && (
          <div className="mb-8">
            <label className="label mb-2">🔄 Sélectionner une équipe</label>
            <select
              className="input max-w-md"
              value={selectedTeamIndex}
              onChange={(e) => setSelectedTeamIndex(Number(e.target.value))}
            >
              {allTeams.map((teamItem, index) => (
                <option key={index} value={index}>
                  {teamItem.team.name} ({teamItem.members.length} membre{teamItem.members.length > 1 ? 's' : ''})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Nom de l'équipe en haut au centre */}
        <div className="text-center mb-12">
          <h1 className="page-title">👥 {team.name}</h1>
          {team.description && (
            <p className="text-lg subtle mt-2">{team.description}</p>
          )}
          {allTeams.length > 1 && (
            <p className="text-sm subtle mt-2">
              Équipe {selectedTeamIndex + 1} sur {allTeams.length}
            </p>
          )}
        </div>

        {/* Onglets */}
        <div className="flex justify-center gap-4 mb-8">
          <button
            className={`nav-pill ${activeTab === 'members' ? 'nav-pill-active' : ''}`}
            onClick={() => setActiveTab('members')}
          >
            👥 Mon équipe ({members.length})
          </button>
          <button
            className={`nav-pill ${activeTab === 'manager' ? 'nav-pill-active' : ''}`}
            onClick={() => setActiveTab('manager')}
          >
            👔 Manager
          </button>
        </div>

        {/* Contenu des onglets */}
        {activeTab === 'members' && (
          <Card title="👥 Membres de l'équipe">
            {members.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📭</div>
                <p className="text-lg subtle">Aucun membre dans cette équipe pour le moment.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {members.map(member => {
                  const isManager = member.id === manager.id;
                  return (
                    <div
                      key={member.id}
                      className="card p-6 hover:shadow-lg transition-all"
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
                             style={{ background: isManager 
                               ? 'linear-gradient(135deg, rgba(255, 212, 0, 0.4), rgba(255, 212, 0, 0.2))' 
                               : 'linear-gradient(135deg, rgba(255, 212, 0, 0.2), rgba(255, 212, 0, 0.1))' }}>
                          {isManager ? '👔' : '👤'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-lg mb-1 truncate">
                            {member.firstName} {member.lastName}
                          </h3>
                          <p className="text-sm subtle truncate mb-2">
                            ✉️ {member.email}
                          </p>
                          {member.phone && (
                            <p className="text-sm subtle truncate mb-2">
                              📞 {member.phone}
                            </p>
                          )}
                          <div className="flex flex-wrap gap-2 mt-2">
                            {isManager && (
                              <span className="inline-block px-2 py-1 text-xs font-semibold rounded-full"
                                    style={{ background: 'rgba(255, 212, 0, 0.3)', color: 'hsl(var(--ink))' }}>
                                👔 Manager
                              </span>
                            )}
                            {member.admin && (
                              <span className="inline-block px-2 py-1 text-xs font-semibold rounded-full"
                                    style={{ background: 'rgba(255, 212, 0, 0.2)', color: 'hsl(var(--ink))' }}>
                                ⭐ Admin
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        )}

        {activeTab === 'manager' && (
          <Card title="👔 Manager de l'équipe">
            <div className="max-w-2xl mx-auto">
              <div className="flex items-start gap-6 p-6 rounded-2xl"
                   style={{ background: 'linear-gradient(135deg, rgba(255, 212, 0, 0.1), rgba(255, 212, 0, 0.05))' }}>
                <div className="w-20 h-20 rounded-full flex items-center justify-center text-4xl"
                     style={{ background: 'linear-gradient(135deg, rgba(255, 212, 0, 0.3), rgba(255, 212, 0, 0.15))' }}>
                  👔
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold mb-3">
                    {manager.firstName} {manager.lastName}
                  </h2>
                  <div className="space-y-2">
                    <p className="flex items-center gap-2">
                      <span className="font-semibold">✉️ Email:</span>
                      <span className="subtle">{manager.email}</span>
                    </p>
                    {manager.phone && (
                      <p className="flex items-center gap-2">
                        <span className="font-semibold">📞 Téléphone:</span>
                        <span className="subtle">{manager.phone}</span>
                      </p>
                    )}
                    {manager.admin && (
                      <span className="inline-block mt-2 px-3 py-1.5 text-sm font-semibold rounded-full"
                            style={{ background: 'rgba(255, 212, 0, 0.3)', color: 'hsl(var(--ink))' }}>
                        ⭐ Administrateur
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Informations supplémentaires sur l'équipe */}
              <div className="mt-6 p-6 rounded-2xl border" style={{ borderColor: 'rgba(255, 212, 0, 0.3)' }}>
                <h3 className="font-bold text-lg mb-4">📊 Informations de l'équipe</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-semibold mb-1">🕐 Heure de début</p>
                    <p className="text-lg">{team.startHour}h00</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold mb-1">🕔 Heure de fin</p>
                    <p className="text-lg">{team.endHour}h00</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold mb-1">👥 Nombre de membres</p>
                    <p className="text-lg">{members.length}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold mb-1">🆔 ID de l'équipe</p>
                    <p className="text-sm font-mono subtle truncate">{team.id}</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>
    </Shell>
  )
}
