
export const BASE_URL = import.meta.env.VITE_API_URL || ""

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

  const res = await fetch(url, init)

  if (res.status === 401) { 
    if (window.location.pathname !== '/login') {
      window.location.pathname = '/login'
    }
    const e: any = new Error("UNAUTHORIZED"); e.status = 401; e.response = res; throw e 
  }
  if (res.status === 403) { const e: any = new Error("FORBIDDEN");    e.status = 403; e.response = res; throw e }
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
    const e: any = new Error(msg || `HTTP ${res.status}`); e.status = res.status; e.response = res; throw e
  }

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
