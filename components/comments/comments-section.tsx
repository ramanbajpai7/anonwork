"use client"

import type React from "react"
import { useEffect, useState } from "react"
import type { Comment } from "@/lib/types"
import { CommentItem } from "./comment-item"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/hooks/use-auth"

interface CommentsSectionProps {
  postId: string
}

export function CommentsSection({ postId }: CommentsSectionProps) {
  const { user } = useAuth()
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState("")
  const [loading, setLoading] = useState(true)
  const [posting, setPosting] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    async function fetchComments() {
      try {
        const response = await fetch(`/api/posts/${postId}/comments?page=1&limit=50`)
        if (response.ok) {
          const data = await response.json()
          setComments(data.comments || [])
        }
      } catch (err) {
        console.error("Failed to fetch comments:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchComments()
  }, [postId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    if (!newComment.trim()) {
      return
    }

    setPosting(true)

    try {
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: newComment }),
      })

      if (!response.ok) {
        const data = await response.json()
        setError(data.message || "Failed to post comment")
        return
      }

      const data = await response.json()
      setComments([...comments, data.comment])
      setNewComment("")
    } catch (err: any) {
      setError(err.message || "Failed to post comment")
    } finally {
      setPosting(false)
    }
  }

  async function handleDelete(commentId: string) {
    try {
      const response = await fetch(`/api/comments/${commentId}`, { method: "DELETE" })
      if (response.ok) {
        setComments(comments.filter((c) => c.id !== commentId))
      }
    } catch (err) {
      console.error("Failed to delete comment:", err)
    }
  }

  return (
    <div className="mt-8 border-t border-border pt-8">
      <h3 className="text-lg font-semibold mb-6">Comments ({comments.length})</h3>

      {/* Comment Form */}
      {user && (
        <form onSubmit={handleSubmit} className="mb-8 p-4 bg-muted rounded-lg">
          {error && <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm mb-4">{error}</div>}

          <Textarea
            placeholder="Add your comment..."
            rows={4}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            disabled={posting}
            className="mb-4"
          />

          <Button type="submit" disabled={posting || !newComment.trim()}>
            {posting ? "Posting..." : "Post Comment"}
          </Button>
        </form>
      )}

      {/* Comments List */}
      <div>
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Loading comments...</div>
        ) : comments.length > 0 ? (
          comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment as any}
              canDelete={user?.id === comment.author_id}
              onDelete={() => handleDelete(comment.id)}
            />
          ))
        ) : (
          <div className="text-center py-8 text-muted-foreground">No comments yet. Be the first!</div>
        )}
      </div>
    </div>
  )
}
