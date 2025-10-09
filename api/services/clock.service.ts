import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { Log, logs } from "../models/log.model";

export type ReportTimeInput = {
  is_departure: boolean,
};

export async function reportTime(
  user_id: string,
  {
    is_departure
  }: ReportTimeInput
): Promise<Log> {
  const [log] = await db
    .insert(logs)
    .values({ user_id, isDeparture: is_departure })
    .returning();

  return log;
}

// TODO params
// TODO format
export async function retrieveReportTimeSummary(user_id: string): Promise<{ at: Date, isDeparture: boolean }[]> {
  const results = await db
    .select({
      at: logs.at,
      isDeparture: logs.isDeparture,
    })
    .from(logs)
    .where(eq(logs.user_id, user_id));
  return results;
}
