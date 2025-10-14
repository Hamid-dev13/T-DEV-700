// src/context/AuthContext.jsx
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import * as api from '../utils/api.js'

const AuthCtx = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const u = await api.getSession()
        if (!alive) return
        setUser(u || null)
      } catch {
        if (!alive) return
        setUser(null)
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => { alive = false }
  }, [])

  const login = async (email, password) => {
    setLoading(true)
    try {
      const u = await api.login(email, password)
      setUser(u || null)
      return u
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    setLoading(true)
    try {
      api.logout()
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const value = useMemo(() => ({ user, loading, login, logout }), [user, loading])
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>
}

export function useAuth() { return useContext(AuthCtx) }
