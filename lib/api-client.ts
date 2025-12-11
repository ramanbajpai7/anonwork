// Client-side API helper

export async function apiCall(endpoint: string, options: RequestInit = {}): Promise<any> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api"
  const url = `${baseUrl}${endpoint}`

  const response = await fetch(url, {
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
