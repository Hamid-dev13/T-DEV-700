import React, { FormEvent, useEffect, useState } from 'react'
import { navigate } from '../router'
import { Shell, Card } from '../components/Layout'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  useEffect(() => {
    document.title = "Login • Time Manager"
  }, [])
  
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
    <div className="h-screen flex items-center justify-center bg-gray-50 p-4 overflow-hidden">
      {/* Logo MR5 en haut à gauche fixe */}
      <div className="fixed top-8 left-8 z-50">
        <h1 className="text-5xl md:text-6xl font-black tracking-tighter" 
            style={{ 
              background: 'linear-gradient(135deg, #FFD400 0%, #FF8C00 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              letterSpacing: '-0.05em'
            }}>
          MR5
        </h1>
      </div>

      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        {/* Cadre Bienvenue sur le côté */}
        <div className="login-hero">
          <h1 className="login-title">Bienvenue 👋</h1>
          <p className="login-sub">Connectez-vous pour accéder à votre tableau de bord.</p>
        </div>

        {/* Card de connexion */}
        <Card title="Connexion">
          <form onSubmit={onSubmit} className="login-form">
            {error && (
              <div className="subtle mb-3" style={{color:'#b42318'}}>
                {error}
              </div>
            )}
            
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
              <button type="submit" className="btn" disabled={loading}>
                {loading ? 'Connexion...' : 'Se connecter'}
              </button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  )
}
