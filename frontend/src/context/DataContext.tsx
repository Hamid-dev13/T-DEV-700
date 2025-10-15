import React, { createContext, useContext, useEffect, useMemo, useState, ReactNode, } from 'react'
import { useAuth } from './AuthContext'
import { Team, Clock } from '../utils/types'
import * as api from '../utils/api'

interface DataContextType {
  loading: boolean
  error: unknown
  teams: Team[]
  clocks: Clock[]
  refresh: () => Promise<void>
}

const DataCtx = createContext<DataContextType | null>(null)

export function DataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<unknown>(null)
  const [teams, setTeams] = useState<Team[]>([])
  const [clocks, setClocks] = useState<Clock[]>([])

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
          api.getTeams().catch((e: any) => (e?.code === 401 ? [] : Promise.reject(e))),
          user?.id ? api.getClocks(user.id, new Date(), new Date()).catch((e: any) => (e?.code === 401 ? [] : Promise.reject(e))) : Promise.resolve([]),
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
      const [t, c] = await Promise.all([
        api.getTeams(),
        user?.id ? api.getClocks(user.id, new Date(), new Date()) : Promise.resolve([])
      ])
      setTeams(t || []); setClocks(c || [])
    } catch (e) {
      setError(e)
    }
  }

  const value = useMemo(() => ({ loading, error, teams, clocks, refresh }), [loading, error, teams, clocks])
  return <DataCtx.Provider value={value}>{children}</DataCtx.Provider>
}

export function useData(): DataContextType {
  const context = useContext(DataCtx)
  if (!context) {
    throw new Error('useData must be used within a DataProvider')
  }
  return context
}
