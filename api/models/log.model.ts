import { pgTable, uuid, timestamp } from "drizzle-orm/pg-core";
import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { users } from "./user.model";
import { boolean } from "drizzle-orm/pg-core";

export const logs = pgTable("logs", {
  id: uuid("id").notNull().defaultRandom().primaryKey(),
  user_id: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  at: timestamp("at").defaultNow().notNull(),
  isDeparture: boolean("is_departure").notNull(),
});

// Types
export type Log = InferSelectModel<typeof logs>;
export type NewLog = InferInsertModel<typeof logs>;