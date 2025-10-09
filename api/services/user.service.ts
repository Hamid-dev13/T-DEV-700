import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { safeUserSelect, users, type SafeUser } from "../models/user.model";
import { hashPassword, verifyPassword } from "../utils/password";
import jwt from "jsonwebtoken";
import type { StringValue } from "ms";

export type LoginInput = {
  email: string;
  password: string;
};

export type AddUserInput = {
  first_name: string,
  last_name: string,
  email: string,
  password: string,
  phone?: string,
};

export type UpdateUserInput = {
  first_name?: string,
  last_name?: string,
  email?: string,
  password?: string,
  phone?: string,
};

export async function loginUser({
  email,
  password,
}: LoginInput): Promise<string> {
  if (!email || !password) {
    throw new Error("Missing required fields: email, password");
  }

  const rows = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  const user = rows[0];
  if (!user) {
    throw new Error("Invalid credentials");
  }

  const ok = await verifyPassword(password, user.password);
  if (!ok) {
    throw new Error("Invalid credentials");
  }

  // create token if ok
  const payload = { user_id: user.id, admin: user.admin };
  const token = jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: process.env.JWT_EXPIRES_IN! as StringValue });

  return token;
}

export async function retrieveUser(user_id: string): Promise<SafeUser> {
  const [user] = await db.select(safeUserSelect).from(users)
    .where(eq(users.id, user_id)).limit(1);
  return user;
}

export async function retrieveUsers(): Promise<SafeUser[]> {
  return db.select(safeUserSelect).from(users);
}

export async function addUser({
  first_name,
  last_name,
  email,
  password,
  phone,
}: AddUserInput): Promise<SafeUser> {
  if (!first_name || !last_name || !email || !password) {
    throw new Error("Missing required fields: first_name, last_name, email, password");
  }

  password = await hashPassword(password);

  const [user] = await db
    .insert(users)
    .values({firstName: first_name, lastName: last_name, email: email, password: password, phone: phone})
    .returning();
  
  return user as SafeUser;
}

export async function updateUser(
  id: string,
  data: UpdateUserInput
): Promise<SafeUser> {

  if (data.password) {
    data.password = await hashPassword(data.password);
  }

  const [user] = await db
    .update(users)
    .set(data)
    .where(eq(users.id, id))
    .returning();
  return user as SafeUser;
}

export async function deleteUser(id: string): Promise<boolean> {
  const [deleted] = await db
    .delete(users)
    .where(eq(users.id, id))
    .returning();
  
    return deleted.id == id;
}
