import { and, between, eq, gte, lt, lte, notExists, or, sql } from "drizzle-orm";
import { db } from "../db/client";
import { Clock, clocks } from "../models/clock.model";
import { leavePeriods } from "../models/leave_period.model";
import { publicHolidays } from "../models/public_holiday.model";

export type TimePeriodInput = {
  from: Date,
  to: Date,
};

export async function addClock(user_id: string, at?: Date): Promise<Clock> {
  const [clock] = await db
    .insert(clocks)
    .values({ user_id, at })
    .returning();
  return clock;
}

export async function updateClock(user_id: string, from: Date, to: Date): Promise<Clock> {
  // Utiliser une plage de ±1 seconde pour trouver l'enregistrement
  // car la conversion Date entre frontend/backend change les millisecondes
  const fromStart = new Date(from.getTime() - 1000);
  const fromEnd = new Date(from.getTime() + 1000);
  
  const [clock] = await db
    .update(clocks)
    .set({ at: to })
    .where(and(
      eq(clocks.user_id, user_id),
      gte(clocks.at, fromStart),
      lt(clocks.at, fromEnd)
    ))
    .returning();
  return clock;
}

export async function removeClock(user_id: string, at: Date): Promise<Clock[]> {
  // Utiliser une plage de ±1 seconde pour trouver l'enregistrement
  const atStart = new Date(at.getTime() - 1000);
  const atEnd = new Date(at.getTime() + 1000);
  
  return db
    .delete(clocks)
    .where(and(
      eq(clocks.user_id, user_id),
      gte(clocks.at, atStart),
      lt(clocks.at, atEnd)
    ))
    .returning();
}

export async function getClocksForUser(
  user_id: string,
  {
    from,
    to,
  }: TimePeriodInput
): Promise<Date[]> {
  const dateOffset = new Date(0);
  dateOffset.setDate(2);  // 1 based, next day is 2

  const results = await db
    .select({
      at: clocks.at,
    })
    .from(clocks)
    .where(and(
      eq(clocks.user_id, user_id),
      between(clocks.at, from, new Date(to.getTime() + dateOffset.getTime()))
    ))
    .orderBy(clocks.at);

  return results.map((row) => row.at);
}

/**
 * Get clocks for user, excluding those that fall within accepted leave periods
 */
export async function getClocksForUserFiltered(
  user_id: string,
  {
    from,
    to,
  }: TimePeriodInput
): Promise<Date[]> {
  const dateOffset = new Date(0);
  dateOffset.setDate(2);  // 1 based, next day is 2

  const results = await db
    .select({
      at: clocks.at,
    })
    .from(clocks)
    .where(and(eq(clocks.user_id, user_id),
      between(clocks.at, from, new Date(to.getTime() + dateOffset.getTime())),
      notExists(db.select()
        .from(leavePeriods)
        .where(and(
          eq(leavePeriods.user_id, clocks.user_id),
          eq(leavePeriods.accepted, true),
          between(clocks.at, leavePeriods.startDate, leavePeriods.endDate)))
      ),
      notExists(
        db.select()
          .from(publicHolidays)
          .where(eq(publicHolidays.date, sql`date(${clocks.at})`))
      )
    ))
    .orderBy(clocks.at);

  return results.map((row) => row.at);
}

export async function getDaysOffForUser(
  user_id: string,
  {
    from,
    to,
  }: TimePeriodInput
): Promise<any> {
  const dateOffset = new Date(0);
  dateOffset.setDate(2);  // 1 based, next day is 2

  const toNext = new Date(to.getTime() + dateOffset.getTime());
  const fromDateStr = from.toISOString().substring(0, 10);
  const toNextDateStr = toNext.toISOString().substring(0, 10);

  const holidays = await db
    .select()
    .from(publicHolidays)
    .where(between(publicHolidays.date, fromDateStr, toNextDateStr))
    .then(rows => rows.map(row => row.date));
  
  const leaveDays = await db
    .select()
    .from(leavePeriods)
    .where(and(
      eq(leavePeriods.user_id, user_id),
      or(
        gte(leavePeriods.startDate, from),
        lte(leavePeriods.endDate, toNext),
        or(and(
          lte(leavePeriods.startDate, from),
          gte(leavePeriods.endDate, toNext)
        ))
      )
    ));
  
  const leaveDates: string[] = [];
  
  // fill with dates from leave periods
  for (const leave of leaveDays) {
    let current = leave.startDate;
    const end = leave.endDate;

    while (current <= end) {
      if (current >= from && current <= toNext) {
        leaveDates.push(current.toISOString().substring(0, 10));
      }
      current.setUTCDate(current.getUTCDate() + 1);
    }
  }

  return Array.from(new Set([...holidays, ...leaveDates])).sort();
}
