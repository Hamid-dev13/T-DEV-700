const LS = {
  users: 'tm.users',
  teams: 'tm.teams',
  clocks: 'tm.clocks',
  session: 'tm.session',
  boot: 'tm.booted'
}

function id() { return Math.random().toString(36).slice(2, 10) }

export function bootstrap() {
  if (localStorage.getItem(LS.boot)) return
  const manager = {
    id: id(), role: 'manager',
    firstName: 'Amina', lastName: 'Diallo',
    email: 'manager1@example.com', phone: '+33 6 00 00 00 01',
    password: 'manager123'
  }
  const emp1 = {
    id: id(), role: 'employee',
    firstName: 'Lucas', lastName: 'Martin',
    email: 'employee1@example.com', phone: '+33 6 00 00 00 02',
    password: 'employee123'
  }
  const emp2 = {
    id: id(), role: 'employee',
    firstName: 'Zoé', lastName: 'Bernard',
    email: 'employee2@example.com', phone: '+33 6 00 00 00 03',
    password: 'employee123'
  }
  const team = { id: id(), name: 'Trinity', description: 'Team Trinity', managerId: manager.id, members: [emp1.id, emp2.id] }
  const now = new Date()
  const dayMs = 24*3600*1000
  const clocks: any[] = []
  for (let d=10; d>=0; d--) {
    const base = new Date(now.getTime() - d*dayMs)
    for (const u of [emp1, emp2]) {
      const start = new Date(base); start.setHours(9, Math.floor(Math.random()*20), 0, 0)
      const end = new Date(base); end.setHours(17, Math.floor(Math.random()*20), 0, 0)
      clocks.push({ id: id(), userId: u.id, type: 'in', timestamp: start.toISOString() })
      clocks.push({ id: id(), userId: u.id, type: 'out', timestamp: end.toISOString() })
    }
  }
  localStorage.setItem(LS.users, JSON.stringify([manager, emp1, emp2]))
  localStorage.setItem(LS.teams, JSON.stringify([team]))
  localStorage.setItem(LS.clocks, JSON.stringify(clocks))
  localStorage.setItem(LS.boot, '1')
}

export function getUsers() { return JSON.parse(localStorage.getItem(LS.users) || '[]') }
export function getTeams() { return JSON.parse(localStorage.getItem(LS.teams) || '[]') }
export function getClocks() { return JSON.parse(localStorage.getItem(LS.clocks) || '[]') }

export function getSession() {
  const tok = localStorage.getItem(LS.session)
  if (!tok) return null
  try {
    return JSON.parse(atob(tok.split('.')[1]))
  } catch { return null }
}

function setSession(user: any) {
  const payload = btoa(JSON.stringify({ id: user.id, email: user.email, role: user.role, firstName: user.firstName, lastName: user.lastName }))
  localStorage.setItem(LS.session, ['hdr', payload, 'sig'].join('.'))
}

export async function login({ email, password }: { email: string; password: string }) {
  const u = getUsers().find((u: any) => u.email === email && u.password === password)
  if (!u) throw new Error('Identifiants invalides')
  setSession(u)
  return { id: u.id, email: u.email, role: u.role, firstName: u.firstName, lastName: u.lastName }
}

export function logout() { localStorage.removeItem(LS.session) }

export async function updateUser(id: string, updates: any) {
  const users = getUsers()
  const idx = users.findIndex((u: any) => u.id === id)
  if (idx === -1) throw new Error('Utilisateur introuvable')
  users[idx] = { ...users[idx], ...updates }
  localStorage.setItem(LS.users, JSON.stringify(users))
  const sess = getSession()
  if (sess && sess.id === id) setSession(users[idx])
  return { id: users[idx].id, email: users[idx].email, role: users[idx].role, firstName: users[idx].firstName, lastName: users[idx].lastName, phone: users[idx].phone }
}

export async function deleteUser(id: string) {
  const users = getUsers().filter((u: any) => u.id !== id)
  const teams = getTeams().map((t: any) => ({ ...t, members: t.members.filter((m: any) => m !== id) }))
  localStorage.setItem(LS.users, JSON.stringify(users))
  localStorage.setItem(LS.teams, JSON.stringify(teams))
}

export async function addClock({ userId, type, timestamp }: { userId: string; type: string; timestamp: Date | string }) {
  const clocks = getClocks()
  clocks.push({ id: id(), userId, type, timestamp: (timestamp instanceof Date ? timestamp.toISOString() : timestamp) })
  localStorage.setItem(LS.clocks, JSON.stringify(clocks))
}

export function getUserClocks(userId: string, fromISO?: string, toISO?: string) {
  const from = fromISO ? new Date(fromISO) : new Date('1970-01-01')
  const to = toISO ? new Date(toISO) : new Date('2999-12-31')
  return getClocks().filter((c: any) => c.userId === userId && new Date(c.timestamp) >= from && new Date(c.timestamp) <= to)
}

export function computeDailyHours(events: any[]) {
  const byDay: any = {}
  for (const e of events) {
    const d = e.timestamp.slice(0,10)
    byDay[d] = byDay[d] || []
    byDay[d].push(e)
  }
  const res: any[] = []
  for (const [day, arr] of Object.entries(byDay)) {
    const sorted = (arr as any[]).sort((a: any,b: any)=> new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    let total = 0
    for (let i=0;i<sorted.length;i+=2) {
      const a = sorted[i], b = sorted[i+1]
      if (a && b && a.type === 'in' && b.type === 'out') {
        total += (new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()) / 3600000
      }
    }
    res.push({ day, hours: parseFloat(total.toFixed(2)) })
  }
  return res.sort((a,b)=> a.day.localeCompare(b.day))
}

export function weekOf(dateStr: string) {
  const d = new Date(dateStr)
  const onejan = new Date(d.getFullYear(),0,1)
  const week = Math.ceil((((d.getTime() - onejan.getTime()) / 86400000) + onejan.getDay()+1)/7)
  return `${d.getFullYear()}-W${String(week).padStart(2,'0')}`
}

export function aggregateWeekly(daily: any[]) {
  const byW: any = {}
  for (const d of daily) {
    const w = weekOf(d.day)
    byW[w] = (byW[w] || 0) + d.hours
  }
  return Object.entries(byW).map(([week, hours]) => ({ week, hours: parseFloat((hours as number).toFixed(2)) }))
}

export function teamAverages(teamId: string, fromISO?: string, toISO?: string) {
  const team = getTeams().find((t: any) => t.id === teamId)
  if (!team) return { daily: [], weekly: [] }
  const members = team.members
  const dAgg: any = {}
  const wAgg: any = {}
  let count = members.length || 1
  for (const m of members) {
    const events = getUserClocks(m, fromISO, toISO)
    for (const d of computeDailyHours(events)) {
      dAgg[d.day] = (dAgg[d.day] || 0) + d.hours
    }
    for (const w of aggregateWeekly(computeDailyHours(events))) {
      wAgg[w.week] = (wAgg[w.week] || 0) + w.hours
    }
  }
  const daily = Object.entries(dAgg).map(([day, hours]) => ({ day, hours: parseFloat(((hours as number)/count).toFixed(2)) })).sort((a,b)=>a.day.localeCompare(b.day))
  const weekly = Object.entries(wAgg).map(([week, hours]) => ({ week, hours: parseFloat(((hours as number)/count).toFixed(2)) })).sort((a,b)=>a.week.localeCompare(b.week))
  return { daily, weekly }
}
