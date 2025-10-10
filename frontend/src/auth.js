const USERS_KEY = 'users_v1'
const CURRENT_KEY = 'current_user_id_v1'
const ENTRIES_KEY = 'pointage_entries_v1'
const SEEDED_KEY = 'users_seeded_v1'

const PREDEFINED = [
  { id: 'u-mgr-1', name: 'Manager Demo', email: 'manager@demo.com', phone: '', role: 'manager', password: 'demo123' },
  { id: 'u-emp-1', name: 'Alice Demo',   email: 'alice@demo.com',   phone: '', role: 'employee', password: 'demo123' },
  { id: 'u-emp-2', name: 'Bob Demo',     email: 'bob@demo.com',     phone: '', role: 'employee', password: 'demo123' },
]

export function seedUsers() {
  try {
    if (localStorage.getItem(SEEDED_KEY)) return
    const existing = loadUsers()
    if (existing.length === 0) {
      localStorage.setItem(USERS_KEY, JSON.stringify(PREDEFINED))
    } else {
      const emails = new Set(existing.map(u => (u.email||'').toLowerCase()))
      const merged = [...existing]
      for (const u of PREDEFINED) {
        if (!emails.has((u.email||'').toLowerCase())) merged.push(u)
      }
      localStorage.setItem(USERS_KEY, JSON.stringify(merged))
    }
    localStorage.setItem(SEEDED_KEY, '1')
  } catch {}
}

export function loadUsers() {
  try { return JSON.parse(localStorage.getItem(USERS_KEY)) ?? [] } catch { return [] }
}
export function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}
export function currentUser() {
  const id = localStorage.getItem(CURRENT_KEY)
  if (!id) return null
  return loadUsers().find(u => u.id === id) || null
}

export function signInWithPassword(email, password) {
  const e = (email||'').trim().toLowerCase()
  const p = (password||'')
  if (!e || !p) throw new Error('Identifiants requis')
  const users = loadUsers()
  const user = users.find(u => (u.email||'').toLowerCase() === e && (u.password||'') === p)
  if (!user) throw new Error('Email ou mot de passe invalide')
  localStorage.setItem(CURRENT_KEY, user.id)
  return user
}

// Legacy
export function signIn(name, role) {
  const trimmed = (name||'').trim()
  if (!trimmed) throw new Error('Nom requis')
  let users = loadUsers()
  let user = users.find(u => (u.name||'').toLowerCase() === trimmed.toLowerCase() && u.role === role)
  if (!user) {
    user = { id: crypto.randomUUID(), name: trimmed, role, email: '', phone: '', password: '' }
    users = [user, ...users]
    saveUsers(users)
  }
  localStorage.setItem(CURRENT_KEY, user.id)
  return user
}

export function signOut() { localStorage.removeItem(CURRENT_KEY) }
export function updateAccount(partial) {
  const me = currentUser()
  if (!me) return
  const users = loadUsers().map(u => u.id === me.id ? { ...u, ...partial } : u)
  saveUsers(users)
}
export function deleteAccount() {
  const me = currentUser()
  if (!me) return
  const users = loadUsers().filter(u => u.id !== me.id)
  saveUsers(users)
  signOut()
}

export function loadEntries() {
  try { return JSON.parse(localStorage.getItem(ENTRIES_KEY)) ?? [] } catch { return [] }
}
export function saveEntries(entries) { localStorage.setItem(ENTRIES_KEY, JSON.stringify(entries)) }

export function punch(kind) {
  const me = currentUser()
  if (!me) throw new Error('Non authentifié')
  const entry = { id: crypto.randomUUID(), userId: me.id, name: me.name, role: me.role, kind, time: new Date().toISOString() }
  const all = [entry, ...loadEntries()]
  saveEntries(all)
  return entry
}

export function entriesForUser(userId) { return loadEntries().filter(e => e.userId === userId) }
export function employeesOnly() { return loadUsers().filter(u => u.role === 'employee') }

function pairwiseDurations(entries) {
  let open = null, ms = 0
  for (const e of entries) {
    if (e.kind === 'in') open = e
    else if (e.kind === 'out' && open) {
      const a = new Date(open.time).getTime(), b = new Date(e.time).getTime()
      if (!Number.isNaN(a) && !Number.isNaN(b) && b > a) ms += (b - a)
      open = null
    }
  }
  return ms
}
export function computeDailyHoursForUser(userId, startISO, endISO) {
  const start = startISO ? new Date(startISO) : null
  const end = endISO ? new Date(endISO) : null
  const list = entriesForUser(userId).filter(e => {
    const t = new Date(e.time)
    return (!start || t >= start) && (!end || t <= end)
  }).sort((a,b)=> new Date(a.time) - new Date(b.time))
  const map = new Map()
  for (const e of list) {
    const d = new Date(e.time)
    const key = d.toISOString().slice(0,10)
    if (!map.has(key)) map.set(key, [])
    map.get(key).push(e)
  }
  const result = []
  for (const [day, arr] of map.entries()) {
    const ms = pairwiseDurations(arr)
    result.push({ day, hours: ms / 3600000 })
  }
  result.sort((a,b)=> a.day.localeCompare(b.day))
  return result
}
export function averageDailyHoursForTeam(startISO, endISO) {
  const emps = employeesOnly(), map = new Map()
  for (const user of emps) {
    const perDay = computeDailyHoursForUser(user.id, startISO, endISO)
    for (const d of perDay) {
      const v = map.get(d.day) || { total: 0, count: 0 }
      v.total += d.hours; v.count += 1; map.set(d.day, v)
    }
  }
  const res = []
  for (const [day, v] of map.entries()) {
    res.push({ day, avg: v.count ? v.total / v.count : 0 })
  }
  res.sort((a,b)=> a.day.localeCompare(b.day))
  return res
}
