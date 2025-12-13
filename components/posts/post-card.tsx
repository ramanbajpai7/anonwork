"use client"

import { useState } from "react"
import type { Post } from "@/lib/types"
import { MessageCircle, ThumbsUp, ThumbsDown, Share2, Bookmark, BookmarkCheck, Loader2, Check, ArrowUp, Eye } from "lucide-react"
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
  const [isHovered, setIsHovered] = useState(false)

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
      <div 
        className="glass border border-border/50 rounded-2xl p-5 card-hover group relative overflow-hidden"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Gradient accent on hover */}
        <div className={`absolute top-0 left-0 w-full h-1 gradient-bg transition-all duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`} />
        
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
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
                <span className="font-semibold text-sm group-hover:text-primary transition-colors">
                  {authorDisplayName || authorUsername}
                </span>
                {authorVerified && (
                  <span className="text-xs bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-600 px-2 py-0.5 rounded-full font-medium">
                    ✓ Verified
                  </span>
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
              <span className="text-xs bg-gradient-to-r from-primary/10 to-accent/10 px-3 py-1.5 rounded-full text-foreground font-medium">
                {post.topic.icon} {post.topic.name}
              </span>
            )}
            {post.channel && !post.topic && (
              <span className="text-xs bg-muted px-3 py-1.5 rounded-full text-muted-foreground font-medium">
                {post.channel.name}
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        {post.title && (
          <h3 className="text-lg font-bold mb-2 text-foreground group-hover:gradient-text transition-all duration-300">
            {post.title}
          </h3>
        )}
        <p className="text-foreground/80 mb-4 line-clamp-3 leading-relaxed">{post.body}</p>

        {/* Meta Stats */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-muted/50 rounded-full">
            <MessageCircle className="h-4 w-4" />
            <span className="font-medium">{post.comment_count || 0}</span>
          </div>
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${
            currentScore > 0 ? 'bg-green-500/10 text-green-600' : 
            currentScore < 0 ? 'bg-red-500/10 text-red-600' : 'bg-muted/50'
          }`}>
            <ArrowUp className="h-4 w-4" />
            <span className="font-medium">{currentScore}</span>
          </div>
          {post.views !== undefined && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-muted/50 rounded-full">
              <Eye className="h-4 w-4" />
              <span className="font-medium">{post.views}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-1 pt-4 border-t border-border/50 flex-wrap">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => handleVote(e, 1)}
            disabled={voteLoading}
            className="text-muted-foreground hover:text-green-600 hover:bg-green-500/10 rounded-xl transition-all duration-200"
          >
            <ThumbsUp className="w-4 h-4 mr-1.5" />
            Upvote
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => handleVote(e, -1)}
            disabled={voteLoading}
            className="text-muted-foreground hover:text-red-600 hover:bg-red-500/10 rounded-xl transition-all duration-200"
          >
            <ThumbsDown className="w-4 h-4 mr-1.5" />
            Downvote
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            className="text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-xl transition-all duration-200"
          >
            <MessageCircle className="w-4 h-4 mr-1.5" />
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
              className={`rounded-xl transition-all duration-200 ${
                isBookmarked 
                  ? "text-amber-600 bg-amber-500/10" 
                  : "text-muted-foreground hover:text-amber-600 hover:bg-amber-500/10"
              }`}
            >
              {bookmarkLoading ? (
                <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
              ) : isBookmarked ? (
                <BookmarkCheck className="w-4 h-4 mr-1.5" />
              ) : (
                <Bookmark className="w-4 h-4 mr-1.5" />
              )}
              {isBookmarked ? "Saved" : "Save"}
            </Button>
          )}
          <Button 
            variant="ghost" 
            size="sm"
            className={`rounded-xl transition-all duration-200 ${
              shareSuccess 
                ? "text-green-600 bg-green-500/10" 
                : "text-muted-foreground hover:text-blue-600 hover:bg-blue-500/10"
            }`}
            onClick={async (e) => {
              e.preventDefault()
              e.stopPropagation()
              
              const shareUrl = `${window.location.origin}/posts/${post.id}`
              const shareData = {
                title: post.title || "Check out this post on AnonWork",
                text: post.body?.slice(0, 100) + (post.body && post.body.length > 100 ? "..." : ""),
                url: shareUrl,
              }
              
              if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
                try {
                  await navigator.share(shareData)
                  return
                } catch (err) {
                  // Fall back to clipboard
                }
              }
              
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
                <Check className="w-4 h-4 mr-1.5" />
                Copied!
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4 mr-1.5" />
                Share
              </>
            )}
          </Button>
        </div>
      </div>
    </Link>
  )
}
