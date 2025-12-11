"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/hooks/use-auth"
import { redirect } from "next/navigation"
import type { Post } from "@/lib/types"
import { PostModerationCard } from "@/components/admin/post-moderation-card"
import { Button } from "@/components/ui/button"

export default function AdminPostsPage() {
  const { user } = useAuth()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState("active")

  useEffect(() => {
    if (user && !["admin", "moderator"].includes(user.role)) {
      redirect("/dashboard")
    }
  }, [user])

  useEffect(() => {
    async function fetchPosts() {
      try {
        const response = await fetch(`/api/admin/posts?status=${filterStatus}&limit=50`)
        if (response.ok) {
          const data = await response.json()
          setPosts(data.posts || [])
        }
      } catch (err) {
        console.error("Failed to fetch posts:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchPosts()
  }, [filterStatus])

  function handlePostAction() {
    // Refresh posts
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
    }, 1000)
  }

  if (!user) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  if (!["admin", "moderator"].includes(user.role)) {
    return <div className="flex items-center justify-center min-h-screen">Access Denied</div>
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold mb-4">Post Moderation</h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          {["active", "hidden", "removed"].map((status) => (
            <Button
              key={status}
              variant={filterStatus === status ? "default" : "outline"}
              onClick={() => setFilterStatus(status)}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Button>
          ))}
        </div>

        {/* Posts Grid */}
        <div>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading posts...</div>
          ) : posts.length > 0 ? (
            <div className="grid gap-4">
              {posts.map((post) => (
                <PostModerationCard key={post.id} post={post as any} onAction={handlePostAction} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">No posts found</div>
          )}
        </div>
      </div>
    </div>
  )
}
