import { and, eq, gte, lt } from "drizzle-orm";
import { db } from "../db/client";
import { Clock, clocks } from "../models/clock.model";

export type ReportTimeSummaryInput = {
  from: Date,
  to: Date,
};

export async function reportTime(user_id: string): Promise<Clock> {
  const [clock] = await db
    .insert(clocks)
    .values({ user_id })
    .returning();
  return clock;
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
