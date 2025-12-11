"use client"

import type { Comment } from "@/lib/types"
import { formatDistanceToNow } from "date-fns"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"

interface CommentItemProps {
  comment: Comment & {
    author?: { id: string; anon_username: string; is_verified_employee: boolean }
  }
  onDelete?: () => void
  canDelete?: boolean
}

export function CommentItem({ comment, onDelete, canDelete }: CommentItemProps) {
  return (
    <div className="border border-border rounded-lg p-4 mb-4">
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm">{comment.author?.anon_username}</span>
          {comment.author?.is_verified_employee && (
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">Verified</span>
          )}
        </div>
        <span className="text-xs text-muted-foreground">
          {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
        </span>
      </div>

      <p className="text-foreground mb-3">{comment.body}</p>

      {canDelete && (
        <Button variant="ghost" size="sm" onClick={onDelete} className="text-destructive hover:text-destructive">
          <Trash2 className="w-4 h-4 mr-1" />
          Delete
        </Button>
      )}
    </div>
  )
}
