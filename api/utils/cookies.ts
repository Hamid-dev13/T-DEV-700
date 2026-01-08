import { CookieOptions } from "express";
import ms, { StringValue } from "ms";

export const COOKIE_ACCESS_TOKEN_KEY = "accessToken";
export const COOKIE_REFRESH_TOKEN_KEY = "refreshToken";

export const ACCESS_TOKEN_COOKIE_OPTS: CookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: ms(process.env.ACCESS_TOKEN_EXPIRES_IN! as StringValue),
};

export const REFRESH_TOKEN_COOKIE_OPTS: CookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: ms(process.env.REFRESH_TOKEN_EXPIRES_IN! as StringValue),
};

export function getCookie(cookies: string, name: string) {
  const match = cookies.match(new RegExp("(^| )" + name + "=([^;]+)"));
  if (match) return match[2];
  return null;
}
