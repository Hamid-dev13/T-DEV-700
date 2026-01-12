import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { safeUserSelect, toSafeUser, User, users, type SafeUser } from "../models/user.model";
import { hashPassword, verifyPassword, verifyPasswordRequirements } from "../utils/password";
import jwt from "jsonwebtoken";
import type { StringValue } from "ms";


export function generateAccessToken(user: User): string {
  return jwt.sign({ user_id: user.id, admin: user.admin }, process.env.ACCESS_TOKEN_SECRET!,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN! as StringValue });
}

export function generateRefreshToken(user: User): string {
  return jwt.sign({ user_id: user.id }, process.env.REFRESH_TOKEN_SECRET!,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN! as StringValue });
}


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
  admin?: boolean,
};

export type UpdateUserInput = {
  first_name?: string,
  last_name?: string,
  email?: string,
  old_password?: string,
  new_password?: string,
  phone?: string,
  admin?: boolean,
};

export async function loginUser({
  email,
  password,
}: LoginInput): Promise<{ accessToken: string, refreshToken: string, user: SafeUser }> {
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

  // create tokens if ok
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  await updateRefreshTokenForUser(user.id, refreshToken);

  return { accessToken, refreshToken, user: toSafeUser(user) };
}

export async function updateRefreshTokenForUser(user_id: string, refreshToken: string) {
  await db.update(users)
    .set({ refreshToken })
    .where(eq(users.id, user_id))
}

export async function clearRefreshTokenForUser(user_id: string) {
  await db.update(users)
    .set({ refreshToken: null })
    .where(eq(users.id, user_id))
}

export async function retrieveUserSafe(user_id: string): Promise<SafeUser> {
  const [user] = await db.select(safeUserSelect).from(users)
    .where(eq(users.id, user_id)).limit(1);
  return user;
}

export async function retrieveUser(user_id: string): Promise<User> {
  const [user] = await db.select().from(users)
    .where(eq(users.id, user_id)).limit(1);
  return user;
}

export async function retrieveUsersSafe(): Promise<SafeUser[]> {
  return db.select(safeUserSelect).from(users);
}

export async function addUser({
  first_name,
  last_name,
  email,
  password,
  phone,
  admin,
}: AddUserInput): Promise<SafeUser> {
  if (!first_name || !last_name || !email || !password) {
    throw new Error("Missing required fields: first_name, last_name, email, password");
  }

  if (!verifyPasswordRequirements(password))
    throw new Error("Password doesn't meet the minimum security requirements");

  password = await hashPassword(password);

  const [user] = await db
    .insert(users)
    .values({ firstName: first_name, lastName: last_name, email: email, password: password, phone: phone, admin: admin || false })
    .returning();

  return toSafeUser(user);
}

export async function updateUser(
  id: string,
  {
    first_name,
    last_name,
    email,
    old_password,
    new_password,
    phone,
    admin,
  }: UpdateUserInput,
  bypass_pass_check: boolean = false
): Promise<SafeUser> {
  let password: string | undefined = undefined;
  if ((bypass_pass_check || old_password) && new_password) {
    if (!bypass_pass_check) {
      const user = await retrieveUser(id);
      if (!await verifyPassword(old_password!, user.password))
        throw new Error("Invalid old password");
    }

    if (!verifyPasswordRequirements(new_password))
      throw new Error("Password doesn't meet the minimum security requirements");
    password = await hashPassword(new_password);
  }

  const [user] = await db
    .update(users)
    .set({ firstName: first_name, lastName: last_name, email: email, password: password, phone: phone, admin: admin })
    .where(eq(users.id, id))
    .returning();

  return toSafeUser(user);
}

export async function deleteUser(id: string): Promise<boolean> {
  const [deleted] = await db
    .delete(users)
    .where(eq(users.id, id))
    .returning();

  return deleted.id == id;
}
