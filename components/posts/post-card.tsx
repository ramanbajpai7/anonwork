"use client"

import { useState } from "react"
import type { Post } from "@/lib/types"
import { MessageCircle, ThumbsUp, ThumbsDown, Share2, Flag, Bookmark, BookmarkCheck, Loader2, Check, Send } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { formatDistanceToNow } from "date-fns"
import { useAuth } from "@/hooks/use-auth"
import { UserAvatar, QuickMessageButton } from "@/components/messaging/user-avatar"

interface PostCardProps {
  post: Post & {
    author?: { 
      id?: string
      anon_username?: string
      is_verified_employee?: boolean
      profile_photo_url?: string
      display_name?: string
    }
    author_id?: string
    author_anon_username?: string
    author_is_verified?: boolean
    author_profile_photo?: string
    author_display_name?: string
    channel?: { id?: string; name?: string; type?: string }
    topic?: { name?: string; slug?: string; icon?: string }
    comment_count?: number
    vote_sum?: number
    bookmark_id?: string
  }
  onVote?: (vote: 1 | -1) => void
  onBookmarkChange?: (isBookmarked: boolean) => void
  showBookmark?: boolean
}

export function PostCard({ post, onVote, onBookmarkChange, showBookmark = true }: PostCardProps) {
  const { user } = useAuth()
  const [isBookmarked, setIsBookmarked] = useState(!!post.bookmark_id)
  const [bookmarkLoading, setBookmarkLoading] = useState(false)
  const [voteLoading, setVoteLoading] = useState(false)
  const [currentScore, setCurrentScore] = useState(post.score || post.vote_sum || 0)
  const [shareSuccess, setShareSuccess] = useState(false)

  // Get author info (support both formats)
  const authorId = post.author?.id || post.author_id
  const authorUsername = post.author?.anon_username || post.author_anon_username || "Anonymous"
  const authorVerified = post.author?.is_verified_employee || post.author_is_verified
  const authorPhoto = post.author?.profile_photo_url || post.author_profile_photo
  const authorDisplayName = post.author?.display_name || post.author_display_name

  async function handleBookmark(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    
    if (!user || bookmarkLoading) return
    
    setBookmarkLoading(true)
    try {
      if (isBookmarked) {
        await fetch("/api/bookmarks", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ post_id: post.id }),
        })
        setIsBookmarked(false)
        onBookmarkChange?.(false)
      } else {
        await fetch("/api/bookmarks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ post_id: post.id }),
        })
        setIsBookmarked(true)
        onBookmarkChange?.(true)
      }
    } catch (error) {
      console.error("Bookmark error:", error)
    } finally {
      setBookmarkLoading(false)
    }
  }

  async function handleVote(e: React.MouseEvent, vote: 1 | -1) {
    e.preventDefault()
    e.stopPropagation()
    
    if (!user || voteLoading) return
    
    setVoteLoading(true)
    try {
      const res = await fetch(`/api/posts/${post.id}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vote }),
      })
      if (res.ok) {
        const data = await res.json()
        setCurrentScore(data.score)
      }
      onVote?.(vote)
    } catch (error) {
      console.error("Vote error:", error)
    } finally {
      setVoteLoading(false)
    }
  }

  return (
    <Link href={`/posts/${post.id}`}>
      <div className="border border-border rounded-lg p-4 hover:shadow-md transition-shadow bg-card">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <UserAvatar
              userId={authorId}
              username={authorUsername}
              displayName={authorDisplayName}
              photoUrl={authorPhoto}
              isVerified={authorVerified}
              size="sm"
              showMessageOnClick={true}
            />
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm">
                  {authorDisplayName || authorUsername}
                </span>
                {authorVerified && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">✓ Verified</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {authorDisplayName && (
                  <span className="text-xs text-muted-foreground">@{authorUsername}</span>
                )}
                <span className="text-xs text-muted-foreground">
                  {authorDisplayName ? "•" : ""} {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {post.topic && (
              <span className="text-xs bg-muted px-2 py-1 rounded text-muted-foreground">
                {post.topic.icon} {post.topic.name}
              </span>
            )}
            {post.channel && !post.topic && (
              <span className="text-xs bg-muted px-2 py-1 rounded text-muted-foreground">{post.channel.name}</span>
            )}
          </div>
        </div>

        {/* Content */}
        {post.title && <h3 className="text-lg font-semibold mb-2 text-foreground">{post.title}</h3>}
        <p className="text-foreground mb-4 line-clamp-3">{post.body}</p>

        {/* Meta */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <MessageCircle className="h-4 w-4" />
            {post.comment_count || 0} comments
          </span>
          <span>⬆️ {currentScore} points</span>
        </div>

        {/* Actions */}
        <div className="flex gap-1 mt-4 pt-4 border-t border-border flex-wrap">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => handleVote(e, 1)}
            disabled={voteLoading}
            className="text-muted-foreground hover:text-green-600"
          >
            <ThumbsUp className="w-4 h-4 mr-1" />
            Upvote
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => handleVote(e, -1)}
            disabled={voteLoading}
            className="text-muted-foreground hover:text-red-600"
          >
            <ThumbsDown className="w-4 h-4 mr-1" />
            Downvote
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            className="text-muted-foreground"
          >
            <MessageCircle className="w-4 h-4 mr-1" />
            Comment
          </Button>
          {authorId && (
            <QuickMessageButton
              userId={authorId}
              username={authorUsername}
              displayName={authorDisplayName}
              photoUrl={authorPhoto}
              isVerified={authorVerified}
            />
          )}
          {showBookmark && user && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBookmark}
              disabled={bookmarkLoading}
              className={isBookmarked ? "text-yellow-600" : "text-muted-foreground hover:text-yellow-600"}
            >
              {bookmarkLoading ? (
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              ) : isBookmarked ? (
                <BookmarkCheck className="w-4 h-4 mr-1" />
              ) : (
                <Bookmark className="w-4 h-4 mr-1" />
              )}
              {isBookmarked ? "Saved" : "Save"}
            </Button>
          )}
          <Button 
            variant="ghost" 
            size="sm"
            className={shareSuccess ? "text-green-600" : "text-muted-foreground hover:text-blue-600"}
            onClick={async (e) => {
              e.preventDefault()
              e.stopPropagation()
              
              const shareUrl = `${window.location.origin}/posts/${post.id}`
              const shareData = {
                title: post.title || "Check out this post on AnonWork",
                text: post.body?.slice(0, 100) + (post.body && post.body.length > 100 ? "..." : ""),
                url: shareUrl,
              }
              
              // Try Web Share API first (for mobile)
              if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
                try {
                  await navigator.share(shareData)
                  return
                } catch (err) {
                  // User cancelled or error, fall back to clipboard
                }
              }
              
              // Fallback to clipboard
              try {
                await navigator.clipboard.writeText(shareUrl)
                setShareSuccess(true)
                setTimeout(() => setShareSuccess(false), 2000)
              } catch (err) {
                console.error("Failed to copy:", err)
              }
            }}
          >
            {shareSuccess ? (
              <>
                <Check className="w-4 h-4 mr-1" />
                Copied!
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4 mr-1" />
                Share
              </>
            )}
          </Button>
        </div>
      </div>
    </Link>
  )
}
