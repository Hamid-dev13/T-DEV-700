import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { Log, logs } from "../models/log.model";

export async function reportTime(user_id: string): Promise<Log> {
  const [log] = await db
    .insert(logs)
    .values({ user_id })
    .returning();
  return log;
}

// TODO params
// TODO format
export async function retrieveReportTimeSummary(user_id: string): Promise<Date[]> {
  const results = await db
    .select({
      at: logs.at,
    })
    .from(logs)
    .where(eq(logs.user_id, user_id));
  return results.map((row) => row.at);
}
