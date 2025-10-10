import React from 'react'
import { Shell, Card } from '../components/Layout'
import { navigate } from '../router'
import { currentUser } from '../auth'

export default function EmployeeHome() {
  const me = currentUser()
  return (
    <Shell>
      <div className="login-wrap">
        <div className="grid-3">
          <Card title="Mon compte" actions={<button className="btn-ghost" onClick={()=>navigate('/employee/account')}>Modifier</button>}>
            <div className="subtle">Nom</div><div className="mb-4">{me?.name}</div>
            <div className="subtle">Email</div><div>{me?.email || '—'}</div>
          </Card>
          <Card title="Pointage" actions={<button className="btn-accent" onClick={()=>navigate('/employee/punch')}>Pointer</button>}>
            <p className="subtle">Signaler heure d’arrivée / départ</p>
          </Card>
          <Card title="Mes tableaux de bord" actions={<button className="btn-ghost" onClick={()=>navigate('/employee/dashboard')}>Ouvrir</button>}>
            <p className="subtle">Synthèse de mes heures et activités</p>
          </Card>
        </div>
        <div className="mt-6">
          <button className="btn-ghost mr-2" onClick={()=>{}}>Mes heures (quot. & hebdo)</button>
          <button className="btn-danger" onClick={()=>navigate('/employee/delete')}>Supprimer mon compte</button>
        </div>
      </div>
    </Shell>
  )
}