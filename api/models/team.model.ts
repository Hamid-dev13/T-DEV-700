import { pgTable, uuid, varchar, timestamp } from "drizzle-orm/pg-core";
import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { real } from "drizzle-orm/pg-core";
import { users } from "./user.model";

export const teams = pgTable("teams", {
  id: uuid("id").notNull().defaultRandom().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: varchar("description", { length: 512 }).notNull(),
  managerId: uuid("manager_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  startHour: real("start_hour").notNull(),
  endHour: real("end_hour").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
});

// Types
export type Team = InferSelectModel<typeof teams>;
export type NewTeam = InferInsertModel<typeof teams>;