import { and, eq } from "drizzle-orm";
import { db } from "../db/client";
import { LeavePeriod, leavePeriods } from "../models/leave_period.model";

export async function retrieveLeavePeriods(user_id: string): Promise<LeavePeriod[]> {
  return db.select().from(leavePeriods)
    .where(eq(leavePeriods.user_id, user_id));
}

export async function addLeavePeriod(user_id: string, startDate: Date, endDate: Date, accepted?: boolean): Promise<LeavePeriod> {
  const [period] = await db
    .insert(leavePeriods)
    .values({ user_id, startDate, endDate, accepted: accepted ?? false })
    .returning();
  
  return period;
}

export type UpdateLeavePeriodInput = {
  accepted?: boolean,
  startDate?: Date,
  endDate?: Date
};

export async function updateLeavePeriod(
  id: string,
  data: UpdateLeavePeriodInput): Promise<LeavePeriod> {
  const [period] = await db
    .update(leavePeriods)
    .set(data)
    .where(eq(leavePeriods.id, id))
    .returning();
  return period;
}

export async function deleteLeavePeriod(id: string): Promise<boolean> {
  const deleted = await db
    .delete(leavePeriods)
    .where(eq(leavePeriods.id, id))
    .returning();
  
  return deleted.length > 0;
}

export async function deleteLeavePeriodOfMyUser(user_id: string, leave_id: string): Promise<boolean> {
  const deleted = await db
    .delete(leavePeriods)
    .where(and(eq(leavePeriods.id, leave_id), eq(leavePeriods.user_id, user_id), eq(leavePeriods.accepted, false)))
    .returning();
  
  return deleted.length > 0;
}
