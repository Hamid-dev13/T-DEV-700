// src/utils/api.js
import apiClient, { clearToken, setToken } from './apiClient.js'
import * as fake from './fakeApi.js'

export const computeDailyHours = fake.computeDailyHours
export const aggregateWeekly   = fake.aggregateWeekly

export const bootstrap = () => {}

export async function getSession() {
  try { return await apiClient.get('/user') } 
  catch (e1) { return null }
}

export async function login(email, password) {
  const payload = { email, password }

  // this returns the user
  return apiClient.post("/user/login", payload);
}

export function logout() {
  clearToken()
}

// --- Users ---
export async function getUsers() {
  return apiClient.get('/users')
}
export async function updateUser(id, updates) {
  return apiClient.patch(`/users/${encodeURIComponent(id)}`, updates)
}
export async function deleteUser(id) {
  return apiClient.delete(`/users/${encodeURIComponent(id)}`)
}

// --- Teams & clocks ---
export async function getTeams() {
  const list = await apiClient.get('/teams')
  return Array.isArray(list) ? list : (list?.items || [])
}

export async function getClocks() {
  try {
    const me = await getSession()
    const userId = me?.id
    if (!userId) return []
    const list = await apiClient.get(`/users/${encodeURIComponent(userId)}/clocks`)
    return Array.isArray(list) ? list : (list?.items || [])
  } catch {
    return []
  }
}

export async function getClocksForUser(id) {
  try {
    const list = await apiClient.get(`/users/${encodeURIComponent(id)}/clocks`)
    return Array.isArray(list) ? list : (list?.items || [])
  } catch {
    return []
  }
}

export async function addClock() {
  return apiClient.post('/clocks')
}

export async function getUserClocks(userId, from, to) {
  const query = { userId, from, to }
  try {
    const list = await apiClient.get('/clocks', { query })
    return Array.isArray(list) ? list : (list?.items || [])
  } catch {
    // Fallback : ancienne route
    try {
      const list = await apiClient.get('/entries', { query: { userId, start: from, end: to } })
      return Array.isArray(list) ? list : (list?.items || [])
    } catch {
      return []
    }
  }
}

export async function teamAverages(teamId, from, to) {
  try {
    return await apiClient.get(`/teams/${encodeURIComponent(teamId)}/averages`, { query: { from, to } })
  } catch {}
  const teams = await getTeams()
  const team = teams.find(t => t.id === teamId)
  if (!team) return { daily: [], weekly: [] }

  const members = team.members || []
  const dailyAgg = {}
  const weeklyAgg = {}
  const round2 = (x) => Number.parseFloat((Math.round(x * 100) / 100).toFixed(2))
  const count = members.length || 1

  for (const m of members) {
    const events = await getUserClocks(m, from, to)
    const daily = computeDailyHours(events)
    for (const d of daily) dailyAgg[d.day] = (dailyAgg[d.day] || 0) + d.hours
    const weekly = aggregateWeekly(daily)
    for (const w of weekly) weeklyAgg[w.week] = (weeklyAgg[w.week] || 0) + w.hours
  }

  const daily = Object.entries(dailyAgg)
    .map(([day, hours]) => ({ day, hours: round2(hours / count) }))
    .sort((a, b) => a.day.localeCompare(b.day))

  const weekly = Object.entries(weeklyAgg)
    .map(([week, hours]) => ({ week, hours: round2(hours / count) }))
    .sort((a, b) => a.week.localeCompare(b.week))

  return { daily, weekly }
}
