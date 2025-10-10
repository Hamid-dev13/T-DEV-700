import { pgTable, uuid, timestamp } from "drizzle-orm/pg-core";
import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { users } from "./user.model";

export const clocks = pgTable("clocks", {
  id: uuid("id").notNull().defaultRandom().primaryKey(),
  user_id: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  at: timestamp("at").defaultNow().notNull(),
});

// Types
export type Clock = InferSelectModel<typeof clocks>;
export type NewClock = InferInsertModel<typeof clocks>;