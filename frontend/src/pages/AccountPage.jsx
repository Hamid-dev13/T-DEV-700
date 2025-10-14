import React, { useState } from 'react'
import { Shell, Card } from '../components/Layout'
import { updateAccount, currentUser } from '../auth'

export default function AccountPage() {
  const me = currentUser()
  const [name, setName] = useState(me?.name || '')
  const [email, setEmail] = useState(me?.email || '')
  const [phone, setPhone] = useState(me?.phone || '')
  const [password, setPassword] = useState('')

  function save(e){
    e.preventDefault()
    updateAccount({ name, email, phone, ...(password ? { password } : {}) })
    alert('Compte mis à jour.')
    history.back()
  }

  return (
    <Shell>
      <div className="login-wrap">
        <Card title="Modifier mon compte">
          <form onSubmit={save} className="grid-2">
            <div>
              <label className="label">Nom</label>
              <input className="input mt-1" value={name} onChange={e=>setName(e.target.value)} placeholder="Votre nom" />
            </div>
            <div>
              <label className="label">Email</label>
              <input className="input mt-1" value={email} onChange={e=>setEmail(e.target.value)} placeholder="ex: prenom@exemple.com" />
            </div>
            <div>
              <label className="label">Téléphone</label>
              <input className="input mt-1" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+33 ..." />
            </div>
            <div>
              <label className="label">Nouveau mot de passe</label>
              <input className="input mt-1" type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Laisser vide pour ne pas changer" />
            </div>
            <div className="col-span-2 mt-2">
              <button className="btn-accent">Enregistrer</button>
            </div>
          </form>
        </Card>
      </div>
    </Shell>
  )
}