import { get, post, put, patch, del } from "./client"

export async function getSession() {
  try { return await get('/user') }
  catch (err: any) { return null }
}

export async function login(email: string, password: string) {
  const payload = { email, password }

  return post("/user/login", payload);
}

export async function logout() {
  return post("/user/logout");
}

export async function getUsers() {
  return get('/users')
}
export async function updateMyProfile(updates: any) {
  // camel case to snake case
  const payload = {
    first_name: updates.firstName,
    last_name: updates.lastName,
    email: updates.email,
    phone: updates.phone,
    ...(updates.oldPassword && updates.newPassword ? { old_password: updates.oldPassword, new_password: updates.newPassword } : {})
  }
  return put('/user', payload)
}
export async function deleteUser(id: string) {
  return del(`/users/${encodeURIComponent(id)}`)
}

export async function getTeams() {
  const list = await get('/teams')
  return Array.isArray(list) ? list : (list?.items || [])
}

export async function getTeamsWithMembers() {
  try {
    const allTeams = await get('/teams')
    const teams = Array.isArray(allTeams) ? allTeams : (allTeams?.items || [])

    const teamsWithMembers = await Promise.all(
      teams.map(async (team: any) => {
        try {
          const teamUsers = await getTeamUsers(team.id)
          return {
            ...team,
            manager: teamUsers.manager,
            members: teamUsers.members || []
          }
        } catch (err) {
          console.error(`Erreur lors de la récupération des membres de l'équipe ${team.id}:`, err)
          return {
            ...team,
            members: []
          }
        }
      })
    )

    return teamsWithMembers
  } catch (err) {
    console.error('Erreur getTeamsWithMembers:', err)
    return []
  }
}

export async function getUserTeam() {
  return get('/users/team')
}

export async function getMyTeams() {
  return get('/user/teams')
}

export async function getTeamUsers(teamId: string) {
  return get(`/teams/${encodeURIComponent(teamId)}/users`)
}

export async function getUserTeamById(userId: string) {
  try {

    const allTeams = await get('/teams')
    const teams = Array.isArray(allTeams) ? allTeams : (allTeams?.items || [])


    for (const team of teams) {
      try {
        const members = await getTeamUsers(team.id)
        const isMember = members.some((m: any) =>
          (typeof m === 'string' && m === userId) ||
          (m && typeof m === 'object' && m.id === userId)
        )
        if (isMember) {
          return { ...team, members }
        }
      } catch (err) {

        continue
      }
    }
    return null
  } catch (err) {
    console.error('Erreur getUserTeamById:', err)
    return null
  }
}

export async function getClocks(id: string, from?: Date, to?: Date): Promise<Array<{ date: Date, iso: string }>> {
  try {
    if (!from) from = new Date()
    if (!to) to = new Date()
    const list = await get(`/users/${encodeURIComponent(id)}/clocks`, { query: { from, to } })
    const dates = list.map((item: string) => {
      const date = new Date(item)
      return { date, iso: item }
    })
    return dates
  } catch (err: any) {
    return []
  }
}

export async function addClock() {
  return post('/clocks')
}

export async function addClockForMember(userId: string, at: Date | string) {
  const payload = {
    at: typeof at === 'string' ? at : at.toISOString()
  }
  try {
    const result = await post(`/users/${encodeURIComponent(userId)}/clocks`, payload)
    return result
  } catch (error) {
    console.error('[API] addClockForMember erreur:', error)
    throw error
  }
}

export async function updateClockForMember(userId: string, from: Date | string, to: Date | string) {
  const payload = {
    from: typeof from === 'string' ? from : from.toISOString(),
    to: typeof to === 'string' ? to : to.toISOString()
  }
  try {
    const result = await patch(`/users/${encodeURIComponent(userId)}/clocks`, payload)
    return result
  } catch (error) {
    console.error('[API] updateClockForMember erreur:', error)
    throw error
  }
}

export async function deleteClockForMember(userId: string, at: Date | string) {
  const payload = {
    at: typeof at === 'string' ? at : at.toISOString()
  }
  try {
    const result = await del(`/users/${encodeURIComponent(userId)}/clocks`, payload)
    return result
  } catch (error) {
    console.error('[API] deleteClockForMember erreur:', error)
    throw error
  }
}

export async function getDaysOffForUser(userId: string, from: string, to: string): Promise<string[]> {
  return get(`/users/${encodeURIComponent(userId)}/days-off?`, { query: { from, to } }).then((res: any) => res.days_off || [])
}

export async function teamAverages(teamId: string, from?: Date, to?: Date) {
  try {
    return await get(`/teams/${encodeURIComponent(teamId)}/averages`, { query: { from, to } })
  } catch { }
  const teams = await getTeams()
  const team = teams.find((t: any) => t.id === teamId)
  if (!team) return { daily: [], weekly: [] }

  const members = team.members || []
  const dailyAgg: any = {}
  const weeklyAgg: any = {}
  const round2 = (x: number) => Number.parseFloat((Math.round(x * 100) / 100).toFixed(2))
  const count = members.length || 1

  for (const m of members) {
    const events = await getClocks(m, from, to)
    const daily = computeDailyHours(events)
    for (const d of daily) dailyAgg[d.day] = (dailyAgg[d.day] || 0) + (d.hours || 0)
    const weekly = aggregateWeekly(daily)
    for (const w of weekly) weeklyAgg[w.week] = (weeklyAgg[w.week] || 0) + (w.hours || 0)
  }

  const daily = Object.entries(dailyAgg)
    .map(([day, hours]) => ({ day, hours: round2((hours as number) / count) }))
    .sort((a, b) => a.day.localeCompare(b.day))

  const weekly = Object.entries(weeklyAgg)
    .map(([week, hours]) => ({ week, hours: round2((hours as number) / count) }))
    .sort((a, b) => a.week.localeCompare(b.week))

  return { daily, weekly }
}

export async function getReports(userId: string, reportType: string, from: Date, to: Date) {
  try {
    const params = new URLSearchParams({
      user: userId,
      report: reportType,
      from: from.toISOString(),
      to: to.toISOString()
    })
    return await get(`/reports?${params.toString()}`)
  } catch (err) {
    console.error('Erreur getReports:', err)
    return []
  }
}

export async function getMyLeavePeriods() {
  return get('/user/leave-periods')
}

export async function getUserLeavePeriods(userId: string) {
  return get(`/users/${encodeURIComponent(userId)}/leave-periods`)
}

export async function createLeavePeriod(startDate: Date, endDate: Date) {
  const payload = {
    start_date: startDate.toISOString(),
    end_date: endDate.toISOString()
  }
  return post('/user/leave-periods', payload)
}

export async function updateLeavePeriodStatus(userId: string, leaveId: string, accepted: boolean) {
  const payload = { accepted }
  return put(`/users/${encodeURIComponent(userId)}/leave-periods/${encodeURIComponent(leaveId)}`, payload)
}

export async function deleteLeavePeriod(leaveId: string) {
  return del(`/user/leave-periods/${encodeURIComponent(leaveId)}`)
}

export async function deleteUserLeavePeriod(userId: string, leaveId: string) {
  return del(`/users/${encodeURIComponent(userId)}/leave-periods/${encodeURIComponent(leaveId)}`)
}

export async function getTeamMembersLeavePeriods(teamId: string) {
  try {
    const teamData = await getTeamUsers(teamId)
    const members = teamData.members || []

    const allPeriods = await Promise.all(
      members.map(async (member: any) => {
        try {
          const periods = await getUserLeavePeriods(member.id)
          return periods.map((period: any) => ({
            ...period,
            user: member
          }))
        } catch (err) {
          console.error(`Erreur lors de la récupération des périodes pour ${member.id}:`, err)
          return []
        }
      })
    )

    return allPeriods.flat()
  } catch (err) {
    console.error('Erreur getTeamMembersLeavePeriods:', err)
    return []
  }
}

export function computeDailyHours(events: any[]) {
  const byDay: any = {}
  for (const e of events) {
    const d = e.timestamp.slice(0, 10)
    byDay[d] = byDay[d] || []
    byDay[d].push(e)
  }
  const res: any[] = []
  for (const [day, arr] of Object.entries(byDay)) {
    const sorted = (arr as any[]).sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    let total = 0
    for (let i = 0; i < sorted.length; i += 2) {
      const a = sorted[i], b = sorted[i + 1]
      if (a && b && a.type === 'in' && b.type === 'out') {
        total += (new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()) / 3600000
      }
    }
    res.push({ day, hours: parseFloat(total.toFixed(2)) })
  }
  return res.sort((a, b) => a.day.localeCompare(b.day))
}

export function weekOf(dateStr: string) {
  const d = new Date(dateStr)
  const onejan = new Date(d.getFullYear(), 0, 1)
  const week = Math.ceil((((d.getTime() - onejan.getTime()) / 86400000) + onejan.getDay() + 1) / 7)
  return `${d.getFullYear()}-W${String(week).padStart(2, '0')}`
}

export function aggregateWeekly(daily: any[]) {
  const byW: any = {}
  for (const d of daily) {
    const w = weekOf(d.day)
    byW[w] = (byW[w] || 0) + d.hours
  }
  return Object.entries(byW).map(([week, hours]) => ({ week, hours: parseFloat((hours as number).toFixed(2)) }))
}
