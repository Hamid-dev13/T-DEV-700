import { and, eq, gte, lt } from "drizzle-orm";
import { db } from "../db/client";
import { Clock, clocks } from "../models/clock.model";

export type ReportTimeSummaryInput = {
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
  }: ReportTimeSummaryInput
): Promise<Date[]> {
  const dateOffset = new Date(0);
  dateOffset.setDate(2);  // 1 based, next day is 2

  const queryCondition = and(
    eq(clocks.user_id, user_id),
    and(
      gte(clocks.at, from),
      lt(clocks.at, new Date(to.getTime() + dateOffset.getTime()))
    )
  );

  const results = await db
    .select({
      at: clocks.at,
    })
    .from(clocks)
    .where(queryCondition)
    .orderBy(clocks.at);

  return results.map((row) => row.at);
}
