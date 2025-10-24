import { pgTable, date } from "drizzle-orm/pg-core";
import { InferInsertModel, InferSelectModel } from "drizzle-orm";

export const publicHolidays = pgTable("public_holidays", {
  date: date("date").notNull().primaryKey(),
});

// Types
export type PublicHoliday = InferSelectModel<typeof publicHolidays>;
export type NewPublicHoliday = InferInsertModel<typeof publicHolidays>;