import { loadUsers, saveUsers } from './auth'

const TEAMS_KEY = 'teams_v1'
const TEAMS_SEEDED_KEY = 'teams_seeded_v1'

function _loadTeamsRaw() {
  try { return JSON.parse(localStorage.getItem(TEAMS_KEY) || '[]') } catch { return [] }
}
function _saveTeamsRaw(teams) {
  localStorage.setItem(TEAMS_KEY, JSON.stringify(teams || []))
}

export function loadTeams() { return _loadTeamsRaw() }
export function saveTeams(teams) { _saveTeamsRaw(teams) }

export function seedTeams() {
  try {
    if (localStorage.getItem(TEAMS_SEEDED_KEY)) return
    let users = loadUsers()
    const managers = users.filter(u => u.role === 'manager')
    if (managers.length < 2) {
      const hasMgr2 = users.some(u => u.id === 'u-mgr-2')
      if (!hasMgr2) {
        users = [
          { id: 'u-mgr-2', name: 'Manager Deux', email: 'manager2@demo.com', phone: '', role: 'manager', password: 'demo123' },
          ...users
        ]
        saveUsers(users)
      }
    }
    const mgrs = (loadUsers().filter(u => u.role === 'manager')).slice(0, 2)
    const teams = _loadTeamsRaw()
    if (teams.length === 0 && mgrs.length >= 2) {
      const t1 = { id: 't-alpha', name: 'Équipe Alpha', managerId: mgrs[0].id, members: [mgrs[0].id] }
      const t2 = { id: 't-beta',  name: 'Équipe Beta',  managerId: mgrs[1].id, members: [mgrs[1].id] }
      _saveTeamsRaw([t1, t2])
    } else if (teams.length === 0 && mgrs.length === 1) {
      const t1 = { id: 't-alpha', name: 'Équipe Alpha', managerId: mgrs[0].id, members: [mgrs[0].id] }
      _saveTeamsRaw([t1])
    }
    localStorage.setItem(TEAMS_SEEDED_KEY, '1')
  } catch (e) {
    console.error('seedTeams failed', e)
  }
}

export function myTeam(managerId) {
  const teams = _loadTeamsRaw()
  return teams.find(t => t.managerId === managerId) || null
}

export function teamMembersObjects(team) {
  const users = loadUsers()
  const set = new Set(team?.members || [])
  return users.filter(u => set.has(u.id))
}

export function ensureManagerHasTeam(managerId) {
  let teams = _loadTeamsRaw()
  let team = teams.find(t => t.managerId === managerId)
  if (!team) {
    team = { id: 't-' + (Date.now()), name: 'Mon équipe', managerId, members: [managerId] }
    teams = [...teams, team]
    _saveTeamsRaw(teams)
  }
  return team
}

export function createUserInManagerTeam(managerId, { name, email }) {
  const trimmedName = (name||'').trim()
  const trimmedEmail = (email||'').trim().toLowerCase()
  if (!trimmedName) throw new Error('Le nom est requis')
  if (!trimmedEmail || !/[^\s@]+@[^\s@]+\.[^\s@]+/.test(trimmedEmail)) throw new Error('Email invalide')

  let users = loadUsers()
  if (users.some(u => (u.email||'').toLowerCase() === trimmedEmail)) {
    throw new Error('Cet email existe déjà')
  }
  const id = 'u-' + (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Date.now())
  const newUser = { id, name: trimmedName, email: trimmedEmail, phone: '', role: 'employee', password: '' }
  users = [...users, newUser]
  saveUsers(users)

  let teams = _loadTeamsRaw()
  let team = teams.find(t => t.managerId === managerId)
  if (!team) {
    team = { id: 't-' + (Date.now()), name: 'Mon équipe', managerId, members: [] }
    teams = [...teams, team]
  }
  if (!team.members.includes(id)) team.members.push(id)
  _saveTeamsRaw(teams)

  return newUser
}

export function updateUserInTeam(managerId, userId, { name, email }) {
  let users = loadUsers()
  const idx = users.findIndex(u => u.id === userId)
  if (idx < 0) throw new Error('Utilisateur introuvable')
  const newName = (name ?? users[idx].name).trim()
  const newEmail = (email ?? users[idx].email).trim().toLowerCase()
  if (!newName) throw new Error('Le nom est requis')
  if (!/[^\s@]+@[^\s@]+\.[^\s@]+/.test(newEmail)) throw new Error('Email invalide')
  if (users.some((u,i) => i!==idx && (u.email||'').toLowerCase() == newEmail)) {
    throw new Error('Cet email existe déjà')
  }
  users[idx] = { ...users[idx], name: newName, email: newEmail }
  saveUsers(users)
  let teams = _loadTeamsRaw()
  let team = teams.find(t => t.managerId === managerId)
  if (team && !team.members.includes(userId)) team.members.push(userId)
  _saveTeamsRaw(teams)
  return users[idx]
}

export function removeUserFromManagerTeam(managerId, userId) {
  let teams = _loadTeamsRaw()
  let team = teams.find(t => t.managerId === managerId)
  if (!team) return
  team.members = (team.members||[]).filter(id => id !== userId)
  _saveTeamsRaw(teams)
}
