// src/utils/apiClient.js
import { COOKIE_TOKEN_KEY, getCookie } from "./cookie"

const BASE_URL = import.meta.env.VITE_API_URL || ""

// Token côté client (si ton backend ne met pas un cookie httpOnly)
function getToken() {
  try { return getCookie(document.cookie, COOKIE_TOKEN_KEY) } catch { return null }
}

export function setToken(token, days = 7) {
  if (!token) return
  try {
    const expires = new Date(Date.now() + days*24*60*60*1000).toUTCString()
    document.cookie = `${COOKIE_TOKEN_KEY}=${token}; Expires=${expires}; Path=/; SameSite=Lax`
  } catch {}
}

export function clearToken() {
  try {
    document.cookie = `${COOKIE_TOKEN_KEY}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`
  } catch {}
}

async function request(path, { method = "GET", headers = {}, body, query } = {}) {
  if (!BASE_URL) throw new Error("API base URL not configured. Set VITE_API_URL in your env.")

  const url = new URL(path.replace(/^\//, ""), BASE_URL.endsWith("/") ? BASE_URL : BASE_URL + "/")
  if (query && typeof query === "object") {
    for (const [k, v] of Object.entries(query)) {
      if (v === undefined || v === null) continue
      url.searchParams.set(k, String(v))
    }
  }

  //const token = getToken()
  const init = {
    method,
    credentials: "include", // indispensable si cookie httpOnly côté serveur
    headers: {
      //...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body && typeof body === "object" && !(body instanceof FormData) ? { "Content-Type": "application/json" } : {}),
      ...headers,
    },
    body: body instanceof FormData ? body : (body && typeof body === "object" ? JSON.stringify(body) : body),
  }

  const res = await fetch(url, init)

  if (res.status === 401) { const e = new Error("UNAUTHORIZED"); e.code = 401; throw e }
  if (res.status === 403) { const e = new Error("FORBIDDEN");    e.code = 403; throw e }
  if (!res.ok) {
    let msg = ""
    try { msg = await res.text() } catch {}
    const e = new Error(msg || `HTTP ${res.status}`); e.code = res.status; throw e
  }

  const ct = res.headers.get("content-type") || ""
  if (ct.includes("application/json")) return res.json()
  if (ct.includes("text/")) return res.text()
  return null
}

export const api = {
  get: (path, opts) => request(path, { ...opts, method: "GET" }),
  post: (path, body, opts) => request(path, { ...opts, method: "POST", body }),
  patch: (path, body, opts) => request(path, { ...opts, method: "PATCH", body }),
  put: (path, body, opts) => request(path, { ...opts, method: "PUT", body }),
  delete: (path, opts) => request(path, { ...opts, method: "DELETE" }),
}

export default api
