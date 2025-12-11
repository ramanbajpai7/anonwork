"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ThumbsUp, ThumbsDown } from "lucide-react"

interface VoteSectionProps {
  postId: string
  initialScore: number
  onScoreChange?: (newScore: number) => void
}

export function VoteSection({ postId, initialScore, onScoreChange }: VoteSectionProps) {
  const [score, setScore] = useState(initialScore)
  const [userVote, setUserVote] = useState<1 | -1 | 0>(0)
  const [loading, setLoading] = useState(false)

  async function handleVote(vote: 1 | -1) {
    setLoading(true)

    try {
      const response = await fetch(`/api/posts/${postId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vote: userVote === vote ? 0 : vote }),
      })

      if (response.ok) {
        const data = await response.json()
        setScore(data.score)
        setUserVote(data.vote ? data.vote.vote : 0)
        onScoreChange?.(data.score)
      }
    } catch (err) {
      console.error("Failed to vote:", err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
      <Button
        variant={userVote === 1 ? "default" : "ghost"}
        size="sm"
        onClick={() => handleVote(1)}
        disabled={loading}
        className="flex gap-1"
      >
        <ThumbsUp className="w-4 h-4" />
        Upvote
      </Button>

      <span className="text-sm font-semibold min-w-12 text-center">{score}</span>

      <Button
        variant={userVote === -1 ? "default" : "ghost"}
        size="sm"
        onClick={() => handleVote(-1)}
        disabled={loading}
        className="flex gap-1"
      >
        <ThumbsDown className="w-4 h-4" />
        Downvote
      </Button>
    </div>
  )
}
