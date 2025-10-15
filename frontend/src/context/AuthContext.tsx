import React, { createContext, useContext, useEffect, useMemo, useState, ReactNode, useCallback } from 'react'
import { User } from '../utils/types'
import * as api from '../utils/api'

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<User | null>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthCtx = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

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
    return () => {
      alive = false
    }
  }, [])

  const login = useCallback(async (email: string, password: string): Promise<User | null> => {
    setLoading(true)
    try {
      const u = await api.login(email, password)
      setUser(u || null)
      return u
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(async (): Promise<void> => {
    setLoading(true)
    try {
      api.logout()
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  const refreshUser = useCallback(async (): Promise<void> => {
    try {
      const u = await api.getSession()
      setUser(u || null)
    } catch {
      setUser(null)
    }
  }, [])

  const value = useMemo<AuthContextType>(() => ({ user, loading, login, logout, refreshUser }), [user, loading, login, logout, refreshUser])

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthCtx)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
