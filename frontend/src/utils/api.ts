import apiClient, { clearToken } from './apiClient'
import * as fake from './fakeApi'

export const computeDailyHours = fake.computeDailyHours
export const aggregateWeekly   = fake.aggregateWeekly

export const bootstrap = () => {}

export async function getSession() {
  try { return await apiClient.get('/user') } 
  catch (e1) { return null }
}

export async function login(email: string, password: string) {
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
export async function updateMyProfile(updates: any) {
  // Convertir camelCase en snake_case pour le backend
  const payload = {
    first_name: updates.firstName,
    last_name: updates.lastName,
    email: updates.email,
    phone: updates.phone,
    ...(updates.password ? { password: updates.password } : {})
  }
  return apiClient.put('/user', payload)
}
export async function updateUser(id: string, updates: any) {
  return apiClient.put(`/users/${encodeURIComponent(id)}`, updates)
}
export async function deleteUser(id: string) {
  return apiClient.delete(`/users/${encodeURIComponent(id)}`)
}

// --- Teams & clocks ---
export async function getTeams() {
  const list = await apiClient.get('/teams')
  return Array.isArray(list) ? list : (list?.items || [])
}

export async function getTeamsWithMembers() {
  try {
    // Récupérer toutes les équipes
    const allTeams = await apiClient.get('/teams')
    const teams = Array.isArray(allTeams) ? allTeams : (allTeams?.items || [])
    
    // Récupérer les membres pour chaque équipe en parallèle
    const teamsWithMembers = await Promise.all(
      teams.map(async (team: any) => {
        try {
          const teamUsers = await getTeamUsers(team.id)
          // teamUsers contient { manager, members }
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
  return apiClient.get('/users/team')
}

export async function getMyTeams() {
  return apiClient.get('/user/teams')
}

export async function getTeamUsers(teamId: string) {
  return apiClient.get(`/teams/${encodeURIComponent(teamId)}/users`)
}

export async function getUserTeamById(userId: string) {
  try {
    // Récupérer toutes les équipes
    const allTeams = await apiClient.get('/teams')
    const teams = Array.isArray(allTeams) ? allTeams : (allTeams?.items || [])
    
    // Pour chaque équipe, récupérer les membres et trouver celle qui contient l'utilisateur
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
        // Ignorer les erreurs pour les équipes sans accès
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
    const list = await apiClient.get(`/users/${encodeURIComponent(id)}/clocks`, { query: { from, to } })
    console.log('[API] getClocks raw data:', list)
    const dates = list.map((item: string) => {
      const date = new Date(item)
      console.log('[API] Date conversion:', item, '->', date.toISOString())
      return { date, iso: item } // Retourner à la fois la date et le string original
    })
    return dates
  } catch (err: any) {
    console.log("Error getting clocks: %s", err.message)
    return []
  }
}

export async function addClock() {
  return apiClient.post('/clocks')
}

export async function addClockForMember(userId: string, at: Date | string) {
  const payload = {
    at: typeof at === 'string' ? at : at.toISOString()
  }
  console.log('[API] addClockForMember:', { userId, payload })
  try {
    const result = await apiClient.post(`/users/${encodeURIComponent(userId)}/clocks`, payload)
    console.log('[API] addClockForMember réussi, résultat:', result)
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
  console.log('[API] updateClockForMember:', { userId, payload })
  console.log('[API] Dates envoyées - from:', payload.from, 'to:', payload.to)
  try {
    const result = await apiClient.patch(`/users/${encodeURIComponent(userId)}/clocks`, payload)
    console.log('[API] updateClockForMember réussi, résultat:', result)
    if (!result) {
      console.warn('[API] ATTENTION: Le backend a renvoyé undefined/null - l\'enregistrement n\'a probablement pas été trouvé')
    }
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
  console.log('[API] deleteClockForMember:', { userId, payload })
  console.log('[API] Date à supprimer:', payload.at)
  try {
    const result = await apiClient.delete(`/users/${encodeURIComponent(userId)}/clocks`, payload)
    console.log('[API] deleteClockForMember réussi, résultat:', result)
    if (!result) {
      console.warn('[API] ATTENTION: Le backend a renvoyé undefined/null - l\'enregistrement n\'a probablement pas été trouvé')
    }
    return result
  } catch (error) {
    console.error('[API] deleteClockForMember erreur:', error)
    throw error
  }
}

export async function teamAverages(teamId: string, from?: Date, to?: Date) {
  try {
    return await apiClient.get(`/teams/${encodeURIComponent(teamId)}/averages`, { query: { from, to } })
  } catch {}
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

// --- Reports ---
export async function getReports(userId: string, reportType: string, from: Date, to: Date) {
  try {
    const params = new URLSearchParams({
      user: userId,
      report: reportType,
      from: from.toISOString(),
      to: to.toISOString()
    })
    return await apiClient.get(`/reports?${params.toString()}`)
  } catch (err) {
    console.error('Erreur getReports:', err)
    return []
  }
}

// --- Leave Periods ---
export async function getMyLeavePeriods() {
  return apiClient.get('/user/leave-periods')
}

export async function getUserLeavePeriods(userId: string) {
  return apiClient.get(`/users/${encodeURIComponent(userId)}/leave-periods`)
}

export async function createLeavePeriod(startDate: Date, endDate: Date) {
  const payload = {
    start_date: startDate.toISOString(),
    end_date: endDate.toISOString()
  }
  return apiClient.post('/user/leave-periods', payload)
}

export async function updateLeavePeriodStatus(userId: string, leaveId: string, accepted: boolean) {
  const payload = { accepted }
  return apiClient.put(`/users/${encodeURIComponent(userId)}/leave-periods/${encodeURIComponent(leaveId)}`, payload)
}

export async function deleteLeavePeriod(leaveId: string) {
  return apiClient.delete(`/user/leave-periods/${encodeURIComponent(leaveId)}`)
}

export async function deleteUserLeavePeriod(userId: string, leaveId: string) {
  return apiClient.delete(`/users/${encodeURIComponent(userId)}/leave-periods/${encodeURIComponent(leaveId)}`)
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
