import { pgTable, uuid, timestamp } from "drizzle-orm/pg-core";
import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { users } from "./user.model";
import { teams } from "./team.model";

export const userTeams = pgTable("user_teams", {
  id: uuid("id").notNull().defaultRandom().primaryKey(),
  user_id: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  team_id: uuid("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
});

// Types
export type UserTeam = InferSelectModel<typeof userTeams>;
export type NewUserTeam = InferInsertModel<typeof userTeams>;