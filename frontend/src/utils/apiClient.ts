 <reference types="vite/client" />
import { COOKIE_TOKEN_KEY } from "./cookie"

// Récupérer l'URL de base de l'API
let BASE_URL = import.meta.env.VITE_API_URL || ""

// Si la page est chargée en HTTPS et que l'URL de l'API est en HTTP, forcer HTTPS
if (typeof window !== "undefined" && window.location.protocol === "https:" && BASE_URL.startsWith("http://")) {
  BASE_URL = BASE_URL.replace("http://", "https://")
}

export { BASE_URL }

export function clearToken() {
  try {
    document.cookie = `${COOKIE_TOKEN_KEY}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`
  } catch {}
}

async function request(path: string, { method = "GET", headers = {}, payload, query }: { method?: string; headers?: Record<string, string>; payload?: any; query?: Record<string, any> } = {}) {
  if (!BASE_URL) throw new Error("API base URL not configured. Set VITE_API_URL in your env.")

  const url = new URL(path.replace(/^\//, ""), BASE_URL.endsWith("/") ? BASE_URL : BASE_URL + "/")
  if (query && typeof query === "object") {
    for (const [k, v] of Object.entries(query)) {
      if (v === undefined || v === null) continue
      url.searchParams.set(k, String(v))
    }
  }

  const init: RequestInit = {
    method,
    credentials: "include",
    headers: {
      ...payload ? { "Content-Type": "application/json" } : {},
      ...headers,
    },
    body: payload ? JSON.stringify(payload) : undefined,
  }

  if (method === "PATCH" || method === "DELETE") {
    console.log(`[apiClient] ${method} ${url.toString()}`)
    console.log('[apiClient] Payload:', payload)
    console.log('[apiClient] Body:', init.body)
  }

  const res = await fetch(url, init)

  if (res.status === 401) { const e: any = new Error("UNAUTHORIZED"); e.code = 401; throw e }
  if (res.status === 403) { const e: any = new Error("FORBIDDEN");    e.code = 403; throw e }
  if (!res.ok) {
    let msg = ""
    try {
      const contentType = res.headers.get("content-type") || ""
      if (contentType.includes("application/json")) {
        const json = await res.json()
        msg = json.error || json.message || JSON.stringify(json)
      } else {
        msg = await res.text()
      }
    } catch {}
    const e: any = new Error(msg || `HTTP ${res.status}`); e.code = res.status; throw e
  }

  // Gérer les réponses vides (204, 200 sans body)
  if (res.status === 204 || res.headers.get("content-length") === "0") {
    return null
  }

  const ct = res.headers.get("content-type") || ""
  if (ct.includes("application/json")) {
    const text = await res.text()
    return text ? JSON.parse(text) : null
  }
  if (ct.includes("text/")) return res.text()
  return null
}

export const api = {
  get: (path: string, opts?: any) => request(path, { ...opts, method: "GET" }),
  post: (path: string, payload?: any, opts?: any) => request(path, { ...opts, method: "POST", payload: payload }),
  patch: (path: string, payload?: any, opts?: any) => request(path, { ...opts, method: "PATCH", payload: payload }),
  put: (path: string, payload?: any, opts?: any) => request(path, { ...opts, method: "PUT", payload: payload }),
  delete: (path: string, payload?: any, opts?: any) => request(path, { ...opts, method: "DELETE", payload: payload }),
}

export default api
