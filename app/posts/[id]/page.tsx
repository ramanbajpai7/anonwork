"use client"

import { useEffect, useState } from "react"
import type { Post } from "@/lib/types"
import { CommentsSection } from "@/components/comments/comments-section"
import { VoteSection } from "@/components/voting/vote-section"
import { Header } from "@/components/layout/header"
import { formatDistanceToNow } from "date-fns"
import { useParams } from "next/navigation"
import { ArrowLeft, Share2, Check, Eye } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function PostDetailPage() {
  const params = useParams()
  const postId = params.id as string
  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)
  const [shareSuccess, setShareSuccess] = useState(false)

  async function handleShare() {
    const shareUrl = `${window.location.origin}/posts/${postId}`
    const shareData = {
      title: post?.title || "Check out this post on AnonWork",
      text: post?.body?.slice(0, 100) + (post?.body && post.body.length > 100 ? "..." : ""),
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
  }

  useEffect(() => {
    async function fetchPost() {
      try {
        const response = await fetch(`/api/posts/${postId}`)
        if (response.ok) {
          const data = await response.json()
          setPost(data.post)
        }
      } catch (err) {
        console.error("Failed to fetch post:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchPost()
  }, [postId])

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">Loading...</div>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <p className="text-xl">Post not found</p>
          <Link href="/dashboard">
            <Button>Back to Feed</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header with Logo */}
      <Header />

      {/* Post Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Back Button */}
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to Feed
        </Link>

        <article className="bg-card border border-border rounded-lg p-6">
          {/* Post Header */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center text-white font-semibold">
              {(post as any).author_anon_username?.slice(5, 7).toUpperCase() || "AN"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">{(post as any).author_anon_username || "Anonymous"}</span>
                {(post as any).author_is_verified && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">✓ Verified</span>
                )}
              </div>
              <span className="text-sm text-muted-foreground">
                {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
              </span>
            </div>
          </div>

          {/* Post Content */}
          {post.title && <h2 className="text-2xl font-bold mb-4">{post.title}</h2>}
          <p className="text-foreground mb-6 whitespace-pre-wrap leading-relaxed">{post.body}</p>

          {/* Vote Section */}
          <div className="mb-6">
            <VoteSection postId={postId} initialScore={post.score} />
          </div>

          {/* Post Stats & Actions */}
          <div className="flex items-center justify-between py-4 border-t border-b border-border">
            <div className="flex gap-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                {post.views} views
              </span>
              <span>💬 {(post as any).comments?.length || 0} comments</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleShare}
              className={shareSuccess ? "text-green-600 border-green-600" : ""}
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
        </article>

        {/* Comments Section */}
        <CommentsSection postId={postId} />
      </div>
    </div>
  )
}
