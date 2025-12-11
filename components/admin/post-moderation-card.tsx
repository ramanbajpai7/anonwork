"use client"

import type { Post } from "@/lib/types"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatDistanceToNow } from "date-fns"

interface PostModerationCardProps {
  post: Post & {
    author?: { id: string; anon_username: string; email?: string }
  }
  onAction?: () => void
}

export function PostModerationCard({ post, onAction }: PostModerationCardProps) {
  const [actionLoading, setActionLoading] = useState(false)

  async function handleAction(action: string) {
    setActionLoading(true)

    try {
      const response = await fetch(`/api/admin/posts/${post.id}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reason: "" }),
      })

      if (response.ok) {
        onAction?.()
      }
    } catch (err) {
      console.error("Action failed:", err)
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-base">{post.title || "Untitled"}</CardTitle>
            <p className="text-sm text-muted-foreground">by {post.author?.anon_username}</p>
          </div>
          <span
            className={`text-xs px-2 py-1 rounded font-semibold ${
              post.status === "active"
                ? "bg-green-100 text-green-700"
                : post.status === "hidden"
                  ? "bg-yellow-100 text-yellow-700"
                  : "bg-red-100 text-red-700"
            }`}
          >
            {post.status.toUpperCase()}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-muted p-3 rounded">
          <p className="text-sm text-muted-foreground line-clamp-4">{post.body}</p>
        </div>

        <div className="flex justify-between items-center text-xs text-muted-foreground">
          <span>Posted {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
          <span>👁️ {post.views} views</span>
        </div>

        {post.status === "active" && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAction("hide")}
              disabled={actionLoading}
              className="flex-1"
            >
              Hide
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleAction("remove")}
              disabled={actionLoading}
              className="flex-1"
            >
              Remove
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
