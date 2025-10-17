import { pgTable, uuid, timestamp, boolean } from "drizzle-orm/pg-core";
import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { users } from "./user.model";

export const leavePeriods = pgTable("leave_periods", {
  id: uuid("id").notNull().defaultRandom().primaryKey(),
  user_id: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  accepted: boolean("accepted").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Types
export type LeavePeriod = InferSelectModel<typeof leavePeriods>;
export type NewLeavePeriod = InferInsertModel<typeof leavePeriods>;