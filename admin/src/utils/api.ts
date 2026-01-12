/// <reference types="vite/client" />

import { User } from "./types";

let BASE_URL = import.meta.env.VITE_API_URL || "";

// Si la page est chargée en HTTPS et que l'URL de l'API est en HTTP, forcer HTTPS
if (
  typeof window !== "undefined" &&
  window.location.protocol === "https:" &&
  BASE_URL.startsWith("http://")
) {
  BASE_URL = BASE_URL.replace("http://", "https://");
}

export { BASE_URL };

async function request(
  path: string,
  {
    method = "GET",
    headers = {},
    payload,
    query,
  }: {
    method?: string;
    headers?: Record<string, string>;
    payload?: any;
    query?: Record<string, any>;
  } = {}
) {
  if (!BASE_URL)
    throw new Error(
      "API base URL not configured. Set VITE_API_URL in your env."
    );

  const url = new URL(
    path.replace(/^\//, ""),
    BASE_URL.endsWith("/") ? BASE_URL : BASE_URL + "/"
  );
  if (query && typeof query === "object") {
    for (const [k, v] of Object.entries(query)) {
      if (v === undefined || v === null) continue;
      url.searchParams.set(k, String(v));
    }
  }

  const init: RequestInit = {
    method,
    credentials: "include",
    headers: {
      ...(payload ? { "Content-Type": "application/json" } : {}),
      ...headers,
    },
    body: payload ? JSON.stringify(payload) : undefined,
  };

  const res = await fetch(url, init);

  if (res.status === 401) {
    const e: any = new Error("UNAUTHORIZED");
    e.status = 401;
    e.response = res;
    throw e;
  }
  if (res.status === 403) {
    const e: any = new Error("FORBIDDEN");
    e.status = 403;
    e.response = res;
    throw e;
  }
  if (!res.ok) {
    let msg = "";
    try {
      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const json = await res.json();
        msg = json.error || json.message || JSON.stringify(json);
      } else {
        msg = await res.text();
      }
    } catch { }
    const e: any = new Error(msg || `HTTP ${res.status}`);
    e.status = res.status;
    e.response = res;
    throw e;
  }

  // Gérer les réponses vides (204, 200 sans body)
  if (res.status === 204 || res.headers.get("content-length") === "0") {
    return null;
  }

  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    const text = await res.text();
    return text ? JSON.parse(text) : null;
  }
  if (ct.includes("text/")) return res.text();
  return null;
}

export async function get(path: string, opts?: any) {
  return request(path, { ...opts, method: "GET" });
}

export async function post(path: string, payload?: any, opts?: any) {
  return request(path, { ...opts, method: "POST", payload: payload });
}

export async function put(path: string, payload?: any, opts?: any) {
  return request(path, { ...opts, method: "PUT", payload: payload });
}

export async function patch(path: string, payload?: any, opts?: any) {
  return request(path, { ...opts, method: "PATCH", payload: payload });
}

export async function del(path: string, payload?: any, opts?: any) {
  return request(path, { ...opts, method: "DELETE", payload: payload });
}

export async function getSession() {
  try {
    return await get("/user");
  } catch (err: any) {
    // check if refresh token expired
    if (err.status === 401) {
      try {
        await refreshSession();
        return await get("/user");
      } catch {
        return null;
      }
    }
    return null;
  }
}

export async function login(email: string, password: string) {
  const payload = { email, password };

  // this returns the user
  return post("/user/login", payload);
}

export async function refreshSession() {
  return post("/user/refresh");
}

export async function logout() {
  return post("/user/logout");
}

// --- Users ---
export async function getUsers() {
  return get("/users");
}

export async function addUser(payload: any) {
  return post("/users", payload);
}

export async function updateUser(id: string, updates: any) {
  return put(`/users/${encodeURIComponent(id)}`, updates);
}
export async function deleteUser(id: string) {
  return del(`/users/${encodeURIComponent(id)}`);
}

// --- Teams & clocks ---
export async function getTeams() {
  const list = await get("/teams");
  return Array.isArray(list) ? list : list?.items || [];
}

export async function getTeamsWithMembers() {
  try {
    // Récupérer toutes les équipes
    const allTeams = await get("/teams");
    const teams = Array.isArray(allTeams) ? allTeams : allTeams?.items || [];

    // Récupérer les membres pour chaque équipe en parallèle
    const teamsWithMembers = await Promise.all(
      teams.map(async (team: any) => {
        try {
          const teamUsers = await getTeamUsers(team.id);
          // teamUsers contient { manager, members }
          return {
            ...team,
            manager: teamUsers.manager,
            members: teamUsers.members || [],
          };
        } catch (err) {
          console.error(
            `Erreur lors de la récupération des membres de l'équipe ${team.id}:`,
            err
          );
          return {
            ...team,
            members: [],
          };
        }
      })
    );

    return teamsWithMembers;
  } catch (err) {
    console.error("Erreur getTeamsWithMembers:", err);
    return [];
  }
}

export async function getUserTeam() {
  return get("/users/team");
}

export async function getMyTeams() {
  return get("/user/teams");
}

export async function getTeamUsers(
  teamId: string
): Promise<{ manager: User; members: User[] }> {
  return get(`/teams/${encodeURIComponent(teamId)}/users`);
}

export async function addTeam(
  name: string,
  description: string,
  start_hour: number,
  end_hour: number,
  manager: string
) {
  const payload = { name, description, start_hour, end_hour, manager };
  return post("/teams", payload);
}

export async function updateTeam(
  teamId: string,
  updates: {
    name?: string;
    description?: string;
    start_hour?: number;
    end_hour?: number;
  }
) {
  return put(`/teams/${encodeURIComponent(teamId)}`, updates);
}

export async function deleteTeam(teamId: string) {
  return del(`/teams/${encodeURIComponent(teamId)}`);
}

export async function addTeamMember(teamId: string, userId: string) {
  return post(`/teams/${encodeURIComponent(teamId)}/users`, { user: userId });
}

export async function removeTeamMember(teamId: string, userId: string) {
  return del(`/teams/${encodeURIComponent(teamId)}/users`, { user: userId });
}

export async function getClocks(
  id: string,
  from?: Date,
  to?: Date
): Promise<Array<{ date: Date; iso: string }>> {
  try {
    if (!from) from = new Date();
    if (!to) to = new Date();
    const list = await get(`/users/${encodeURIComponent(id)}/clocks`, {
      query: { from, to },
    });
    const dates = list.map((item: string) => {
      const date = new Date(item);
      return { date, iso: item };
    });
    return dates;
  } catch (err: any) {
    return [];
  }
}

export async function addClock() {
  return post("/clocks");
}

export async function addClockForMember(userId: string, at: Date | string) {
  const payload = {
    at: typeof at === "string" ? at : at.toISOString(),
  };
  try {
    const result = await post(
      `/users/${encodeURIComponent(userId)}/clocks`,
      payload
    );
    return result;
  } catch (error) {
    console.error("[API] addClockForMember erreur:", error);
    throw error;
  }
}

export async function updateClockForMember(
  userId: string,
  oldFrom: Date | string,
  oldTo: Date | string,
  newFrom: Date | string,
  newTo: Date | string
) {
  const payload = {
    oldFrom: typeof oldFrom === "string" ? oldFrom : oldFrom.toISOString(),
    oldTo: typeof oldTo === "string" ? oldTo : oldTo.toISOString(),
    newFrom: typeof newFrom === "string" ? newFrom : newFrom.toISOString(),
    newTo: typeof newTo === "string" ? newTo : newTo.toISOString(),
  };
  try {
    const result = await patch(
      `/users/${encodeURIComponent(userId)}/clocks`,
      payload
    );
    return result;
  } catch (error) {
    console.error("[API] updateClockForMember erreur:", error);
    throw error;
  }
}

export async function deleteClockForMember(userId: string, at: Date | string) {
  const payload = {
    at: typeof at === "string" ? at : at.toISOString(),
  };
  try {
    const result = await del(
      `/users/${encodeURIComponent(userId)}/clocks`,
      payload
    );
    return result;
  } catch (error) {
    console.error("[API] deleteClockForMember erreur:", error);
    throw error;
  }
}

export async function getDaysOffForUser(
  userId: string,
  from: string,
  to: string
): Promise<string[]> {
  return get(`/users/${encodeURIComponent(userId)}/days-off?`, {
    query: { from, to },
  }).then((res: any) => res.days_off || []);
}

export async function teamAverages(teamId: string, from?: Date, to?: Date) {
  try {
    return await get(`/teams/${encodeURIComponent(teamId)}/averages`, {
      query: { from, to },
    });
  } catch { }
  const teams = await getTeams();
  const team = teams.find((t: any) => t.id === teamId);
  if (!team) return { daily: [], weekly: [] };

  const members = team.members || [];
  const dailyAgg: any = {};
  const weeklyAgg: any = {};
  const round2 = (x: number) =>
    Number.parseFloat((Math.round(x * 100) / 100).toFixed(2));
  const count = members.length || 1;

  for (const m of members) {
    const events = await getClocks(m, from, to);
    const daily = computeDailyHours(events);
    for (const d of daily)
      dailyAgg[d.day] = (dailyAgg[d.day] || 0) + (d.hours || 0);
    const weekly = aggregateWeekly(daily);
    for (const w of weekly)
      weeklyAgg[w.week] = (weeklyAgg[w.week] || 0) + (w.hours || 0);
  }

  const daily = Object.entries(dailyAgg)
    .map(([day, hours]) => ({ day, hours: round2((hours as number) / count) }))
    .sort((a, b) => a.day.localeCompare(b.day));

  const weekly = Object.entries(weeklyAgg)
    .map(([week, hours]) => ({
      week,
      hours: round2((hours as number) / count),
    }))
    .sort((a, b) => a.week.localeCompare(b.week));

  return { daily, weekly };
}

// --- Reports ---
export async function getReports(
  userId: string,
  reportType: string,
  from: Date,
  to: Date
) {
  try {
    const params = new URLSearchParams({
      user: userId,
      report: reportType,
      from: from.toISOString(),
      to: to.toISOString(),
    });
    return await get(`/reports?${params.toString()}`);
  } catch (err) {
    console.error("Erreur getReports:", err);
    return [];
  }
}

// --- Leave Periods ---
export async function getMyLeavePeriods() {
  return get("/user/leave-periods");
}

export async function getUserLeavePeriods(userId: string) {
  return get(`/users/${encodeURIComponent(userId)}/leave-periods`);
}

export async function createLeavePeriod(startDate: Date, endDate: Date) {
  const payload = {
    start_date: startDate.toISOString(),
    end_date: endDate.toISOString(),
  };
  return post("/user/leave-periods", payload);
}

export async function updateLeavePeriodStatus(
  userId: string,
  leaveId: string,
  accepted: boolean
) {
  const payload = { accepted };
  return put(
    `/users/${encodeURIComponent(userId)}/leave-periods/${encodeURIComponent(
      leaveId
    )}`,
    payload
  );
}

export async function deleteLeavePeriod(leaveId: string) {
  return del(`/user/leave-periods/${encodeURIComponent(leaveId)}`);
}

export async function deleteUserLeavePeriod(userId: string, leaveId: string) {
  return del(
    `/users/${encodeURIComponent(userId)}/leave-periods/${encodeURIComponent(
      leaveId
    )}`
  );
}

export async function getTeamMembersLeavePeriods(teamId: string) {
  try {
    const teamData = await getTeamUsers(teamId);
    const members = teamData.members || [];

    const allPeriods = await Promise.all(
      members.map(async (member: any) => {
        try {
          const periods = await getUserLeavePeriods(member.id);
          return periods.map((period: any) => ({
            ...period,
            user: member,
          }));
        } catch (err) {
          console.error(
            `Erreur lors de la récupération des périodes pour ${member.id}:`,
            err
          );
          return [];
        }
      })
    );

    return allPeriods.flat();
  } catch (err) {
    console.error("Erreur getTeamMembersLeavePeriods:", err);
    return [];
  }
}

export function computeDailyHours(events: any[]) {
  const byDay: any = {};
  for (const e of events) {
    const d = e.timestamp.slice(0, 10);
    byDay[d] = byDay[d] || [];
    byDay[d].push(e);
  }
  const res: any[] = [];
  for (const [day, arr] of Object.entries(byDay)) {
    const sorted = (arr as any[]).sort(
      (a: any, b: any) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    let total = 0;
    for (let i = 0; i < sorted.length; i += 2) {
      const a = sorted[i],
        b = sorted[i + 1];
      if (a && b && a.type === "in" && b.type === "out") {
        total +=
          (new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()) /
          3600000;
      }
    }
    res.push({ day, hours: parseFloat(total.toFixed(2)) });
  }
  return res.sort((a, b) => a.day.localeCompare(b.day));
}

export function weekOf(dateStr: string) {
  const d = new Date(dateStr);
  const onejan = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil(
    ((d.getTime() - onejan.getTime()) / 86400000 + onejan.getDay() + 1) / 7
  );
  return `${d.getFullYear()}-W${String(week).padStart(2, "0")}`;
}

export function aggregateWeekly(daily: any[]) {
  const byW: any = {};
  for (const d of daily) {
    const w = weekOf(d.day);
    byW[w] = (byW[w] || 0) + d.hours;
  }
  return Object.entries(byW).map(([week, hours]) => ({
    week,
    hours: parseFloat((hours as number).toFixed(2)),
  }));
}
