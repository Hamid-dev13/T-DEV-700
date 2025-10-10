import { and, eq } from "drizzle-orm";
import { db } from "../db/client";
import { Clock, clocks } from "../models/clock.model";
import { getPeriodQueryCondition } from "../utils/date";

export type ReportTimeSummaryInput = {
  date?: Date,
  days?: number,
};

export async function reportTime(user_id: string): Promise<Clock> {
  const [clock] = await db
    .insert(clocks)
    .values({ user_id })
    .returning();
  return clock;
}

export async function retrieveReportTimeSummary(
  user_id: string,
  {
    date,
    days,
  }: ReportTimeSummaryInput
): Promise<Date[]> {
  const now = new Date();
  const periodCondition = getPeriodQueryCondition(clocks.at, now, date, days);

  const queryCondition = periodCondition ? and(eq(clocks.user_id, user_id), periodCondition) : eq(clocks.user_id, user_id);

  const results = await db
    .select({
      at: clocks.at,
    })
    .from(clocks)
    .where(queryCondition)
    .orderBy(clocks.at);

  return results.map((row) => row.at);
}
