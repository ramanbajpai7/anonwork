"use client"

import { useAuth } from "@/hooks/use-auth"
import { useEffect, useState } from "react"
import type { Post } from "@/lib/types"
import { PostCard } from "@/components/posts/post-card"
import { CreatePostDialog } from "@/components/posts/create-post-dialog"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/layout/header"
import { Sidebar } from "@/components/layout/sidebar"
import { MobileNav } from "@/components/layout/mobile-nav"
import { redirect } from "next/navigation"
import { PenSquare, TrendingUp, Clock, Plus } from "lucide-react"

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [feedType, setFeedType] = useState<"recent" | "popular">("recent")

  useEffect(() => {
    if (!authLoading && !user) {
      redirect("/login")
    }
  }, [user, authLoading])

  useEffect(() => {
    async function fetchPosts() {
      try {
        const response = await fetch(`/api/posts?feed_type=${feedType}&page=1&limit=20`)
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
  }, [feedType])

  const handlePostCreated = (newPost: any) => {
    setPosts([newPost, ...posts])
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header 
        rightContent={
          <CreatePostDialog 
            onPostCreated={handlePostCreated}
            trigger={
              <Button className="gap-2">
                <PenSquare className="h-4 w-4" />
                <span className="hidden sm:inline">Create Post</span>
              </Button>
            }
          />
        }
      />
      
      <div className="flex">
        <Sidebar />
        
        <main className="flex-1 p-4 lg:p-8 pb-20 lg:pb-8">
          <div className="max-w-3xl mx-auto">
            {/* Welcome */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold">Welcome back, {user?.anon_username}!</h1>
              <p className="text-muted-foreground">Here's what's happening in your community</p>
            </div>

            {/* Feed Filters */}
            <div className="flex gap-2 mb-6">
              <Button
                variant={feedType === "recent" ? "default" : "outline"}
                onClick={() => setFeedType("recent")}
                className="gap-2"
              >
                <Clock className="h-4 w-4" />
                Recent
              </Button>
              <Button
                variant={feedType === "popular" ? "default" : "outline"}
                onClick={() => setFeedType("popular")}
                className="gap-2"
              >
                <TrendingUp className="h-4 w-4" />
                Popular
              </Button>
            </div>

            {/* Posts List */}
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Loading posts...</div>
              ) : posts.length > 0 ? (
                posts.map((post) => <PostCard key={post.id} post={post as any} />)
              ) : (
                <div className="text-center py-16 bg-card rounded-xl border border-border">
                  <div className="w-16 h-16 bg-primary/10 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <PenSquare className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">No posts yet</h3>
                  <p className="text-muted-foreground mb-6">
                    Be the first to share something with the community!
                  </p>
                  <CreatePostDialog 
                    onPostCreated={handlePostCreated}
                    trigger={
                      <Button size="lg" className="gap-2">
                        <Plus className="h-5 w-5" />
                        Create Your First Post
                      </Button>
                    }
                  />
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      <MobileNav />
    </div>
  )
}
