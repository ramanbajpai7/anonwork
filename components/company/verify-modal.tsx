"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

interface VerifyModalProps {
  companyId: string
  companyName: string
  companyDomain?: string
  onClose: () => void
  onSuccess: () => void
}

export function VerifyModal({ companyId, companyName, companyDomain, onClose, onSuccess }: VerifyModalProps) {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    if (!email) {
      setError("Email required")
      return
    }

    if (companyDomain && !email.endsWith(`@${companyDomain}`)) {
      setError(`Email must be from ${companyDomain} domain`)
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`/api/companies/${companyId}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proof_email: email }),
      })

      if (!response.ok) {
        const data = await response.json()
        setError(data.message || "Verification failed")
        return
      }

      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.message || "Failed to verify")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Verify as Employee</CardTitle>
              <CardDescription>{companyName}</CardDescription>
            </div>
            <button onClick={onClose} className="text-2xl text-muted-foreground hover:text-foreground">
              ×
            </button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm">{error}</div>}

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Company Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder={companyDomain ? `you@${companyDomain}` : "you@company.com"}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
              />
              <p className="text-xs text-muted-foreground">We'll send a verification link to confirm your employment</p>
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Verifying..." : "Send Verification"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
