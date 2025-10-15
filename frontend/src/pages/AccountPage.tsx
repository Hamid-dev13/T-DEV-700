import React, { useState, FormEvent } from 'react'
import { Shell, Card } from '../components/Layout'
import { useAuth } from '../context/AuthContext'
import { updateUser } from '../utils/api'

export default function AccountPage() {
  const { user } = useAuth()
  
  const [firstName, setFirstName] = useState<string>(user?.firstName || '')
  const [lastName, setLastName] = useState<string>(user?.lastName || '')
  const [email, setEmail] = useState<string>(user?.email || '')
  const [phone, setPhone] = useState<string>(user?.phone || '')
  const [password, setPassword] = useState<string>('')

  function save(e: FormEvent) {
    e.preventDefault()

    if (!user?.id) return

    updateUser(user.id, { firstName, lastName, email, phone, ...(password ? { password } : {}) })
      .then(() => {
        alert('Compte mis à jour.')
        history.back()
      }, (err) => {
        alert(`Le compte n\'a pas pu être mis à jour:\n${err.message}`)
      })
  }

  return (
    <Shell>
      <div className="login-wrap">
        <Card title="Modifier mon compte">
          <form onSubmit={save} className="grid-2">
            <div>
              <label className="label">Prénom</label>
              <input className="input mt-1"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Votre prénom"
              />
            </div>
            <div>
              <label className="label">Nom</label>
              <input className="input mt-1"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Votre nom"
              />
            </div>
            <div>
              <label className="label">Email</label>
              <input className="input mt-1"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ex: prenom@exemple.com"
              />
            </div>
            <div>
              <label className="label">Téléphone</label>
              <input className="input mt-1"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+33 ..."
              />
            </div>
            <div>
              <label className="label">Nouveau mot de passe</label>
              <input className="input mt-1"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Laisser vide pour ne pas changer"
              />
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