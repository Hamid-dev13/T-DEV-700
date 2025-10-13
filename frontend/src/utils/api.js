// src/utils/api.js
import apiClient, { clearToken, setToken } from './apiClient.js'
import * as fake from './fakeApi.js'

const BASE_URL = import.meta.env.VITE_API_URL || ''

export const computeDailyHours = fake.computeDailyHours
export const aggregateWeekly   = fake.aggregateWeekly

// --- Auth/session ---
export const bootstrap = () => {}

// getSession : essaie /user puis /me
export async function getSession() {
  try { return await apiClient.get('/user') } 
  catch (e1) {
    if (e1?.code !== 404) return null
    try { return await apiClient.get('/me') } catch { return null }
  }
}

// helper interne qui tente une route sans faire remonter l'erreur
async function tryLogin(path, payload) {
  try {
    return await apiClient.post(path, payload)
  } catch (e) {
    // 404/405 → on re-tentera un autre endpoint
    if (e?.code === 404 || e?.code === 405) return null
    // 401 → mauvais creds : on propage (le formulaire gérera)
    if (e?.code === 401) throw e
    // autres erreurs : on laisse la chance à un autre endpoint
    return null
  }
}

// login : essaye /user/login, puis /auth/login, puis /login
export async function login({ email, password }) {
  const payload = { email, password }

  let res = await tryLogin('/user/login', payload)
  if (!res) res = await tryLogin('/auth/login', payload)
  if (!res) res = await tryLogin('/login', payload)

  if (!res) {
    // Aucun endpoint n'existe : on lève une erreur claire
    const e = new Error('Aucune route de login fonctionnelle (essayé: /user/login, /auth/login, /login)')
    e.code = 404
    throw e
  }

  // Si le backend renvoie un token (non httpOnly), on le stocke
  if (res?.token) setToken(res.token)

  // Si le backend renvoie directement l'utilisateur
  if (res?.user) return res.user

  // Sinon on relit la session (cookie httpOnly posé par le serveur)
  const u = await getSession()
  return u
}

export async function logout() {
  // On tente gentiment les deux
  try { await apiClient.post?.('/auth/logout') } catch {}
  try { await apiClient.post?.('/user/logout') } catch {}
  clearToken()
}

// --- Users ---
export async function getUsers() {
  return await apiClient.get('/users')
}
export async function updateUser(id, updates) {
  return await apiClient.patch(`/users/${encodeURIComponent(id)}`, updates)
}
export async function deleteUser(id) {
  return await apiClient.delete(`/users/${encodeURIComponent(id)}`)
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

export async function addClock({ userId, timestamp }) {
  return await apiClient.post('/clocks', { userId, timestamp })
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
