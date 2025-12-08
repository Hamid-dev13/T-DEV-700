import { pgTable, uuid, varchar, timestamp, boolean } from "drizzle-orm/pg-core";
import { getTableColumns, InferInsertModel, InferSelectModel } from "drizzle-orm";

export const users = pgTable("users", {
  id: uuid("id").notNull().defaultRandom().primaryKey(),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  admin: boolean("admin").notNull().default(false),
  phone: varchar("phone", { length: 20 }),
  refreshToken: varchar("refresh_token", { length: 512 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
});

// Types
export type User = InferSelectModel<typeof users>;
export type NewUser = InferInsertModel<typeof users>;
export type SafeUser = Omit<User, "password" | "refreshToken">;
export const { password, refreshToken, ...safeUserSelect } = getTableColumns(users);
export function toSafeUser(user: User): SafeUser {
  const { password, refreshToken, ...safeUser } = user;
  return safeUser;
}