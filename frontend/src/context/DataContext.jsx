import React, { createContext, useContext, useMemo, useState } from 'react'
import * as api from '../utils/fakeApi.js'

const DataCtx = createContext(null)

export function DataProvider({ children }) {
  const [users, setUsers] = useState(api.getUsers())
  const [teams, setTeams] = useState(api.getTeams())
  const [clocks, setClocks] = useState(api.getClocks())

  const refresh = () => {
    setUsers(api.getUsers())
    setTeams(api.getTeams())
    setClocks(api.getClocks())
  }

  const addClock = async (userId, type, when = new Date()) => {
    await api.addClock({ userId, type, timestamp: when })
    refresh()
  }

  const value = useMemo(() => ({
    users, teams, clocks, refresh, addClock
  }), [users, teams, clocks])

  return <DataCtx.Provider value={value}>{children}</DataCtx.Provider>
}

export function useData() { return useContext(DataCtx) }
