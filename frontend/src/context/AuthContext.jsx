import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import * as api from '../utils/fakeApi.js'

const AuthCtx = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => api.getSession())

  useEffect(() => {
    api.bootstrap() // seed on first run
  }, [])

  const login = async (email, password) => {
    const u = await api.login({ email, password })
    setUser(u)
    return u
  }
  const logout = () => {
    api.logout()
    setUser(null)
  }
  const updateProfile = async (updates) => {
    const updated = await api.updateUser(user.id, updates)
    setUser(updated)
    return updated
  }
  const deleteAccount = async () => {
    await api.deleteUser(user.id)
    logout()
  }

  const value = useMemo(() => ({ user, login, logout, updateProfile, deleteAccount }), [user])
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>
}

export function useAuth() { return useContext(AuthCtx) }
