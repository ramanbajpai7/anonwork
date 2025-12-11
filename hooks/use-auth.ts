"use client"

import { useEffect, useState } from "react"
import type { User } from "@/lib/types"

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function checkAuth() {
      try {
        const response = await fetch("/api/auth/me")
        if (response.ok) {
          const data = await response.json()
          setUser(data.user)
        }
      } catch (err) {
        setError("Failed to check authentication")
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  async function logout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
      setUser(null)
      window.location.href = "/"
    } catch (err) {
      setError("Logout failed")
    }
  }

  return { user, loading, error, logout }
}
