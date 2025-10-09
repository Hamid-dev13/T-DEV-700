import { and, eq } from "drizzle-orm";
import { db } from "../db/client";
import { Log, logs } from "../models/log.model";
import { getPeriodQueryCondition } from "../utils/date";

export type ReportTimeSummaryInput = {
  date?: Date,
  days?: number,
};

export async function reportTime(user_id: string): Promise<Log> {
  const [log] = await db
    .insert(logs)
    .values({ user_id })
    .returning();
  return log;
}

export async function retrieveReportTimeSummary(
  user_id: string,
  {
    date,
    days,
  }: ReportTimeSummaryInput
): Promise<Date[]> {
  const now = new Date();
  const periodCondition = getPeriodQueryCondition(logs.at, now, date, days);

  const queryCondition = periodCondition ? and(eq(logs.user_id, user_id), periodCondition) : eq(logs.user_id, user_id);

  const results = await db
    .select({
      at: logs.at,
    })
    .from(logs)
    .where(queryCondition)
    .orderBy(logs.at);

  return results.map((row) => row.at);
}
