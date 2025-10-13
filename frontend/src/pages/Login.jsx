// src/pages/Login.jsx
import React, { useState } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      const u = await login(email, password)
      const fallback = u?.role === 'manager' ? '/manager/clock' : '/employee/clock'
      const target = from === '/' ? fallback : from
      navigate(target, { replace: true })
    } catch (err) {
      setError(err?.message || 'Identifiants invalides.')
    } finally {
      setBusy(false)
    }
  }

  const emailId = 'login-email'
  const passId  = 'login-password'
  const errId   = 'login-error'

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md p-6 rounded-2xl border">
        <h1 className="text-2xl font-semibold mb-4 text-center">Connexion</h1>

        {error ? (
          <div id={errId} className="mb-3 text-sm text-red-600" role="alert">
            {error}
          </div>
        ) : null}

        <form onSubmit={onSubmit} className="grid gap-3" noValidate>
          {/* Email */}
          <div>
            <label className="text-sm opacity-80" htmlFor={emailId}>
              Email
            </label>
            <input
              id={emailId}
              name="email"
              className="input mt-1 w-full border rounded px-3 py-2"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="vous@exemple.com"
              title="Entrez votre adresse email"
              required
              value={email}
              onChange={(e)=>setEmail(e.target.value)}
              aria-required="true"
              aria-invalid={Boolean(error)}
              aria-describedby={error ? errId : undefined}
            />
          </div>

          {/* Mot de passe */}
          <div>
            <label className="text-sm opacity-80" htmlFor={passId}>
              Mot de passe
            </label>
            <input
              id={passId}
              name="password"
              className="input mt-1 w-full border rounded px-3 py-2"
              type="password"
              autoComplete="current-password"
              placeholder="Votre mot de passe"
              title="Entrez votre mot de passe"
              required
              value={password}
              onChange={(e)=>setPassword(e.target.value)}
              aria-required="true"
              aria-invalid={Boolean(error)}
              aria-describedby={error ? errId : undefined}
            />
          </div>

          <button className="btn border rounded py-2" disabled={busy} aria-busy={busy}>
            {busy ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>

        <div className="text-center mt-4 text-sm opacity-70">
          <Link to="/">Retour</Link>
        </div>
      </div>
    </div>
  )
}
