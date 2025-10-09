import { and, eq } from "drizzle-orm";
import { db } from "../db/client";
import { Team, teams } from "../models/team.model";
import { SafeUser, safeUserSelect, users } from "../models/user.model";
import { userTeams } from "../models/user_team.model";

export type AddTeamInput = {
  name: string,
  description: string,
  start_hour: number,
  end_hour: number,
  manager_id: string,
};

export type UpdateTeamInput = {
  name?: string,
  description?: string,
  start_hour?: number,
  end_hour?: number,
};

/// Checks the work hours range.
export function checkWorkHours(start: number, end: number) {
  return (!(start > end || start === end)) && start >= 0 && end < 24;
}

export async function isTeamManager(user_id: string, team_id: string) {
  const result = await db.
    select()
    .from(teams)
    .where(and(eq(teams.managerId, user_id), eq(teams.id, team_id)))
    .limit(1);
  
    return result.length > 0
}

export async function retreiveTeamsForUser(user_id: string): Promise<Team[]> {
  const userTeamsWithTeams = await db
    .select({
      team: teams,
    })
    .from(userTeams)
    .innerJoin(teams, eq(userTeams.team_id, teams.id))
    .where(eq(userTeams.user_id, user_id));
  
  return userTeamsWithTeams.map((row) => row.team);
}

export async function retreiveTeamsForUserWithManager(user_id: string): Promise<{ team: Team, manager: SafeUser }[]> {
  const userTeamsWithTeamsAndManager = await db
    .select({
      team: teams,
      manager: safeUserSelect,
    })
    .from(userTeams)
    .innerJoin(teams, eq(userTeams.team_id, teams.id))
    .innerJoin(users, eq(teams.managerId, users.id))
    .where(eq(userTeams.user_id, user_id));
  
  return userTeamsWithTeamsAndManager.map((row) => ({
    team: row.team,
    manager: row.manager,
  }));
}

export async function retrieveTeam(id: string): Promise<Team> {
  const [team] = await db.select().from(teams)
    .where(eq(teams.id, id)).limit(1);
  return team;
}

export async function retrieveTeams(): Promise<Team[]> {
  return db.select().from(teams);
}

export async function addTeam({
  name,
  description,
  start_hour,
  end_hour,
  manager_id,
}: AddTeamInput): Promise<Team> {
  if (!name || !description || !start_hour || !end_hour || !manager_id)
    throw new Error("Missing required fields: name, description, start_hour, end_hour, manager_id");

  if (!checkWorkHours(start_hour, end_hour))
    throw new Error("Invalid Work Hour Range")

  const [team] = await db
    .insert(teams)
    .values({name, description, startHour: start_hour, endHour: end_hour, managerId: manager_id})
    .returning();
  
  return team;
}

export async function updateTeam(
  id: string,
  {
    name,
    description,
    start_hour,
    end_hour,
  }: UpdateTeamInput
): Promise<Team> {
  // both or none of the work hour range values must be provided
  if ((start_hour !== undefined) != (end_hour !== undefined))
    throw new Error("Invalid Work Hour Range");

  if (start_hour !== undefined && end_hour !== undefined)
    if (!checkWorkHours(start_hour, end_hour))
      throw new Error("Invalid Work Hour Range");

  const [team] = await db
    .update(teams)
    .set({ name, description, startHour: start_hour, endHour: end_hour })
    .where(eq(teams.id, id))
    .returning();
  return team;
}

export async function deleteTeam(id: string): Promise<boolean> {
  const [_deleted] = await db
    .delete(teams)
    .where(eq(teams.id, id))
    .returning();
  
  // throws error if no rows, so this can always be true
  return true;
}

// export async function retrieveTeamUsers(id: string): Promise<{ users: SafeUser[] }> {
//   const result = await db
//     .select({
//       users: safeUserSelect,
//     })
//     .from(userTeams)
//     // .innerJoin(teams, eq(userTeams.team_id, teams.id))
//     .innerJoin(users, eq(teams.managerId, users.id))
//     .innerJoin(users, eq(userTeams.user_id, users.id))
//     .where(eq(userTeams.team_id, id))
//     .limit(1);
  
//   return result.map((row) => ({
//     users: row.users,
//   }));
// }
