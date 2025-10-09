export function getCookie(cookies: string, name: string) {
  const match = cookies.match(new RegExp("(^| )" + name + "=([^;]+)"));
  if (match) return match[2];
  return null;
}