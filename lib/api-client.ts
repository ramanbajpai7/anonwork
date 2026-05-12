// ============================================
// Client-side API Helper
// ============================================
// Supports TWO modes:
//   1. MONOLITH MODE (default): Calls Next.js API routes at /api/*
//   2. MICROSERVICES MODE: Routes through the API Gateway at localhost:4000
//
// Set NEXT_PUBLIC_USE_GATEWAY=true in .env.local to enable microservices mode.
// ============================================

/**
 * Get the base URL for API calls.
 * - Monolith mode: "" (empty, uses relative URLs like /api/posts)
 * - Microservices mode: "http://localhost:4000" (API Gateway)
 */
function getBaseUrl(): string {
  const useGateway = process.env.NEXT_PUBLIC_USE_GATEWAY === "true"

  if (useGateway) {
    return process.env.NEXT_PUBLIC_API_GATEWAY_URL || "http://localhost:4000"
  }

  // Monolith mode: use relative URLs (empty base)
  return process.env.NEXT_PUBLIC_API_URL || ""
}

/**
 * Core fetch wrapper. Handles JSON parsing, error handling, and
 * cross-origin cookie forwarding for microservices mode.
 */
export async function apiCall(endpoint: string, options: RequestInit = {}): Promise<any> {
  const baseUrl = getBaseUrl()
  const url = `${baseUrl}${endpoint}`

  const response = await fetch(url, {
    // 'include' is required for cross-origin requests (gateway on port 4000)
    // so that the auth_token cookie is sent along with the request
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.message || `API Error: ${response.statusText}`)
  }

  return response.json()
}

export async function apiGet(endpoint: string, token?: string) {
  return apiCall(endpoint, {
    method: "GET",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
}

export async function apiPost(endpoint: string, data: any, token?: string) {
  return apiCall(endpoint, {
    method: "POST",
    body: JSON.stringify(data),
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
}

export async function apiPatch(endpoint: string, data: any, token?: string) {
  return apiCall(endpoint, {
    method: "PATCH",
    body: JSON.stringify(data),
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
}

export async function apiDelete(endpoint: string, token?: string) {
  return apiCall(endpoint, {
    method: "DELETE",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
}

// ============================================
// GATEWAY-AWARE FETCH
// ============================================
// Drop-in replacement for the native fetch() that prepends the gateway URL.
// Components can import this instead of using plain fetch("/api/...").
//
// Usage:
//   import { gatewayFetch } from "@/lib/api-client"
//   const res = await gatewayFetch("/api/posts?page=1")
// ============================================

export async function gatewayFetch(
  input: string,
  init?: RequestInit
): Promise<Response> {
  const baseUrl = getBaseUrl()
  const url = typeof input === "string" && input.startsWith("/api/")
    ? `${baseUrl}${input}`
    : input

  return fetch(url, {
    credentials: "include",
    ...init,
  })
}
