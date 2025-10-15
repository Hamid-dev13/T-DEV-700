import React, { FormEvent, useEffect, useState } from 'react'
import { navigate } from '../router'
import { Shell, Card } from '../components/Layout'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const [email, setEmail] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [error, setError] = useState<string>('')
  const { login, loading } = useAuth()

  useEffect(() => {}, [])

  function onSubmit(e: FormEvent) {
    e.preventDefault()

    if (!loading) {
      login(email, password)
      .then((user) => {
        if (user) {
          setError('')
          navigate('/clock')
        } else {
          setError('Identifiants non valides');
        }
      }, (err) => setError('Identifiants non valides'))
    }
  }

  return (
    <Shell>
      <div className="login-wrap login-grid">
        <div className="login-hero">
          <h1 className="login-title">Bienvenue 👋</h1>
          <p className="login-sub">Connectez-vous pour accéder à votre tableau de bord.</p>
        </div>

        <Card title="Connexion">
          <form onSubmit={onSubmit} className="login-form">
            {error ? <div className="subtle" style={{color:'#b42318', marginBottom:12}}>{error}</div> : null}
            <div className="mb-4">
              <label className="subtle">Email</label>
              <input
                className="input w-full"
                type="email"
                value={email}
                onChange={e=>setEmail(e.target.value)}
                placeholder="vous@exemple.com"
                required
              />
            </div>
            <div className="mb-4">
              <label className="subtle">Mot de passe</label>
              <input
                className="input w-full"
                type="password"
                value={password}
                onChange={e=>setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
            <div className="flex items-center gap-2">
              <button type="submit" className="btn">Se connecter</button>
              </div>
          </form>
        </Card>
      </div>
    </Shell>
  )
}
