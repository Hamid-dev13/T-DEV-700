import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { passwordResetTokens } from "../models/password.model";
import { hashPassword } from "../utils/password";
import { users } from "../models/user.model";

export const TOKEN_EXPIRATION_TIME = new Date(0).setMinutes(parseInt(process.env.PASSWORD_RESET_TOKEN_EXPIRATION || "30"));

export async function generatePasswordResetToken(email: string): Promise<string> {
  return db.transaction(async (tx) => {
    const [user] = await tx
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    // delete previous token (if any)
    await tx.delete(passwordResetTokens)
      .where(eq(passwordResetTokens.user_id, user.id));

    const expiresAt = new Date(Date.now() + TOKEN_EXPIRATION_TIME);

    // create new token
    const [token] = await tx.insert(passwordResetTokens)
      .values({ user_id: user.id, expiresAt })
      .returning();

    return token.id;
  });
}

export async function changePasswordWithToken(password: string, token: string) {
  const [token_entry] = await db
    .select()
    .from(passwordResetTokens)
    .where(eq(passwordResetTokens.id, token))
    .limit(1);

  if (token_entry.expiresAt.getTime() < Date.now())
    throw new Error("Token has expired");

  const hashed_pass = await hashPassword(password);

  await db.transaction(async (tx) => {
    await tx.update(users)
      .set({ password: hashed_pass, refreshToken: null })
      .where(eq(users.id, token_entry.user_id));
    await tx.delete(passwordResetTokens)
      .where(eq(passwordResetTokens.id, token_entry.id));
  });
}