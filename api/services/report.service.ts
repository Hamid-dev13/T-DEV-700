import { and, eq, ne } from "drizzle-orm";
import { db } from "../db/client";
import { teams } from "../models/team.model";
import { getClocksForUserFiltered } from "./clock.service";
import { getLocalHour } from "../utils/timezone";
import { userTeams } from "../models/user_team.model";

const REPORT_FUNC_MAP = new Map<string, (groupedData: [string, Date[]][], startHour: number, endHour: number) => any>([
  ['lateness', calculateLatenessKPI],
  ['pause_times', calculatePauseTimesKPI]
])

function groupByDay(entries: Date[]): [string, Date[]][] {
  const map = new Map<string, Date[]>()
  for (const e of entries) {
    const day = e.toISOString().slice(0, 10)
    const arr = map.get(day) || []
    arr.push(e)
    map.set(day, arr)
  }

  const days = Array.from(map.entries()).map(([day, list]) => {
    list.sort((a, b) => a.getTime() - b.getTime())
    return [day, list] as [string, Date[]]
  }).sort((a, b) => a[0] < b[0] ? 1 : -1)

  return days
}

function workRangeToDate(date: Date, startHour: number, endHour: number) {
  const zeroDate = new Date(date);
  zeroDate.setHours(0, 0, 0, 0);
  return {
    startDate: new Date(zeroDate.getTime() + (startHour * 3600000)),
    endDate: new Date(zeroDate.getTime() + (endHour * 3600000))
  };
}

/**
 * Sum of date pairs (periods) in minutes.
 * Expect dates to be sorted and have an even number of items.
 */
function sumPeriods(dates: Date[]): number {
  let sum = 0;

  for (let i = 0; i < dates.length; i+=2)
    sum += dates[i+1].getTime() - dates[i].getTime();

  return sum / 60000;
}

export async function getReportForUser(user_id: string, report_type: string, from: Date, to: Date): Promise<any> {
  if (!REPORT_FUNC_MAP.has(report_type))
    throw new Error(`Invalid report type \"${report_type}\"`);

  // get main user team
  const [team] = await db
    .select({
      startHour: teams.startHour,
      endHour: teams.endHour,
    })
    .from(userTeams)
    .innerJoin(teams, eq(userTeams.team_id, teams.id))
    .where(and(eq(userTeams.user_id, user_id), ne(teams.managerId, user_id)))
    .limit(1);

  const data = (await getClocksForUserFiltered(user_id, { from, to }))
    .map((dateUTC => new Date(dateUTC)));
  
  const groupedData = groupByDay(data);

  return REPORT_FUNC_MAP.get(report_type)!(groupedData, team.startHour, team.endHour);
}

function calculateLatenessKPI(groupedData: [string, Date[]][], startHour: number, endHour: number): any {
  const latenessMap: any[] = [];

  for (let i = 0; i < groupedData.length; i++) {
    const [ day, dates ] = groupedData[i];

    if (dates.length > 0) {
      const arrivalHour = getLocalHour(dates[0]);
      const expectedHour = startHour;
      
      const delayInHours = arrivalHour - expectedHour;
      const delayInMinutes = Math.round(delayInHours * 60);

      latenessMap.push({ day, lateness: delayInMinutes > 0 ? delayInMinutes : 0 });
    }
  }

  return latenessMap;
}

function calculatePauseTimesKPI(groupedData: [string, Date[]][], startHour: number, endHour: number): any {
  const pauseTimesMap: any[] = [];

  for (let i = 0; i < groupedData.length; i++) {
    const [ day, dates ] = groupedData[i];

    if (dates.length > 0 && dates.length % 2 == 0) {
      const totalMinutes = (dates[dates.length-1].getTime() - dates[0].getTime()) / 60000;
      const workingMinutes = sumPeriods(dates);

      pauseTimesMap.push({ day, pause: totalMinutes - workingMinutes });
    }
  }

  return pauseTimesMap;
}
