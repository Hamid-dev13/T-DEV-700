export const COOKIE_TOKEN_KEY = "token";

export function getCookie(cookies, name) {
  const match = cookies.match(new RegExp("(^| )" + name + "=([^;]+)"));
  if (match) return match[2];
  return null;
}