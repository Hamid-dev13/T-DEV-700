import React, { useEffect, useState } from 'react'
import { navigate } from '../router'
import { signInWithPassword, seedUsers } from '../auth'
import { Shell, Card } from '../components/Layout'

export default function Login() {
  const [email, setEmail] = useState('manager@demo.com')
  const [password, setPassword] = useState('demo123')
  const [error, setError] = useState('')

  useEffect(() => { seedUsers() }, [])

  function quickLogin(role) {
    const creds = role === 'manager'
      ? { email: 'manager@demo.com', password: 'demo123' }
      : { email: 'alice@demo.com', password: 'demo123' };
    setEmail(creds.email);
    setPassword(creds.password);
    setError(''); // clear any previous error
  }

  function onSubmit(e) {
    e.preventDefault()
    try {
      signInWithPassword(email, password)
      setError('')
      navigate('/home')
    } catch (err) {
      setError(err.message || 'Erreur')
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
              <button type="button" className="btn-ghost" onClick={()=>quickLogin('manager')}>Manager demo</button>
              <button type="button" className="btn-ghost" onClick={()=>quickLogin('employee')}>Employé demo</button></div>
          </form>
        </Card>
      </div>
    </Shell>
  )
}
