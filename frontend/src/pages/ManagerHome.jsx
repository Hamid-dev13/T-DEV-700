import React from 'react'
import { Shell, Card } from '../components/Layout'
import { navigate } from '../router'
import { currentUser } from '../auth'

export default function ManagerHome() {
  const me = currentUser()
  return (
    <Shell>
      <div className="login-wrap">
        <div className="grid-3">
          <Card title="Mon compte" actions={<button className="btn-ghost" onClick={()=>navigate('/manager/account')}>Modifier</button>}>
            <div className="subtle">Nom</div><div className="mb-4">{me?.name}</div>
            <div className="subtle">Email</div><div>{me?.email || '—'}</div>
          </Card>
          <Card title="Pointage" actions={<button className="btn-accent" onClick={()=>navigate('/manager/punch')}>Pointer</button>}>
            <p className="subtle">Signaler heure d’arrivée / départ</p>
          </Card>
          <Card title="Mes tableaux de bord" actions={<button className="btn-ghost" onClick={()=>navigate('/manager/dashboard')}>Ouvrir</button>}>
            <p className="subtle">Synthèse de mes heures</p>
          </Card>
        </div>

        <div className="grid-3 mt-6">
          <Card title="Moyennes équipe" actions={<button className="btn-ghost" onClick={()=>navigate('/manager/team-averages')}>Voir</button>}>
            <p className="subtle">Moyennes quotidiennes & hebdo (période)</p>
          </Card>
          <Card title="Heures d’un collaborateur" actions={<button className="btn-ghost" onClick={()=>navigate('/manager/collab-times')}>Voir</button>}>
            <p className="subtle">Quotidien & hebdo par personne</p>
          </Card>
          <Card title="Dashboards collaborateurs" actions={<button className="btn-ghost" onClick={()=>navigate('/manager/collab-dashboards')}>Ouvrir</button>}>
            <p className="subtle">Vue cartes pour l’équipe</p>
          </Card>
        </div>

        <div className="mt-6">
          <button className="btn-danger" onClick={()=>navigate('/manager/delete')}>Supprimer mon compte</button>
        </div>
      </div>
    </Shell>
  )
}