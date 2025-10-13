// src/context/DataContext.jsx
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useAuth } from './AuthContext.jsx'
import * as api from '../utils/api.js'

const DataCtx = createContext(null)

export function DataProvider({ children }) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [teams, setTeams] = useState([])
  const [clocks, setClocks] = useState([])

  useEffect(() => {
    let alive = true
    if (!user) {
      setLoading(false); setError(null); setTeams([]); setClocks([])
      return
    }
    ;(async () => {
      setLoading(true); setError(null)
      try {
        const [t, c] = await Promise.all([
          api.getTeams().catch(e => (e?.code === 401 ? [] : Promise.reject(e))),
          api.getClocks().catch(e => (e?.code === 401 ? [] : Promise.reject(e))),
        ])
        if (!alive) return
        setTeams(t || []); setClocks(c || [])
      } catch (e) {
        if (!alive) return
        setError(e)
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => { alive = false }
  }, [user?.id])

  const refresh = async () => {
    try {
      const [t, c] = await Promise.all([api.getTeams(), api.getClocks()])
      setTeams(t || []); setClocks(c || [])
    } catch (e) {
      setError(e)
    }
  }

  const value = useMemo(() => ({ loading, error, teams, clocks, refresh }), [loading, error, teams, clocks])
  return <DataCtx.Provider value={value}>{children}</DataCtx.Provider>
}
export function useData() { return useContext(DataCtx) }
