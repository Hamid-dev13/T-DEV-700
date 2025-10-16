import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { teams } from "../models/team.model";
import { getClocksForUser } from "./clock.service";
import { getLocalHour } from "../utils/timezone";

export enum ReportType {
  LATENESS = "lateness"
}

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

export async function getReportForUser(user_id: string, team_id: string, report: ReportType, from: Date, to: Date): Promise<any> {
  const [workRange] = await db
    .select({
      startHour: teams.startHour,
      endHour: teams.endHour,
    })
    .from(teams)
    .where(eq(teams.id, team_id))
    .limit(1);

  const data = (await getClocksForUser(user_id, { from, to }))
    .map((dateUTC => new Date(dateUTC)));
  
  const groupedData = groupByDay(data);

  switch (report) {
    case ReportType.LATENESS:
      const latenessMap: any[] = [];

      for (let i = 0; i < groupedData.length; i++) {
        const [ day, dates ] = groupedData[i];

        if (dates.length > 0) {
          const arrivalHour = getLocalHour(dates[0]);
          const expectedHour = workRange.startHour;
          
          const delayInHours = arrivalHour - expectedHour;
          const delayInMinutes = Math.round(delayInHours * 60);

          latenessMap.push({ day, lateness: delayInMinutes > 0 ? delayInMinutes : 0 });
        }
      }

      return latenessMap;
  
    default:
      throw new Error(`Invalid report type \"${report}\"`);
  }

  return {
    user_id,
    team_id,
    report,
    from,
    to
  }
}