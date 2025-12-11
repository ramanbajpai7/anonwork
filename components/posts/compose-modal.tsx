"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/hooks/use-auth"

interface ComposeModalProps {
  onClose: () => void
  onSubmit: (data: { title?: string; body: string; is_anonymous: boolean }) => Promise<void>
}

export function ComposeModal({ onClose, onSubmit }: ComposeModalProps) {
  const { user } = useAuth()
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const [isAnonymous, setIsAnonymous] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    if (!body.trim()) {
      setError("Post body is required")
      return
    }

    setLoading(true)
    try {
      await onSubmit({ title: title || undefined, body, is_anonymous: isAnonymous })
      onClose()
    } catch (err: any) {
      setError(err.message || "Failed to create post")
    } finally {
      setLoading(false)
    }
  }

  if (!user) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Create Post</CardTitle>
              <CardDescription>Share your thoughts with the community</CardDescription>
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
              <label htmlFor="title" className="text-sm font-medium">
                Title (Optional)
              </label>
              <Input
                id="title"
                placeholder="What would you like to discuss?"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="body" className="text-sm font-medium">
                Your Post
              </label>
              <Textarea
                id="body"
                placeholder="Share your insights..."
                rows={6}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="anonymous"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                disabled={loading}
              />
              <label htmlFor="anonymous" className="text-sm font-medium cursor-pointer">
                Post as Anonymous
              </label>
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Publishing..." : "Publish"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
