"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Header } from "@/components/layout/header"
import { Sidebar } from "@/components/layout/sidebar"
import { MobileNav } from "@/components/layout/mobile-nav"
import { PostCard } from "@/components/posts/post-card"
import { CreatePostDialog } from "@/components/posts/create-post-dialog"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Plus, Users } from "lucide-react"
import Link from "next/link"

export default function TopicDetailPage() {
  const params = useParams()
  const slug = params.slug as string
  const [topic, setTopic] = useState<any>(null)
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchTopic = async () => {
    try {
      const res = await fetch(`/api/topics/${slug}`)
      if (res.ok) {
        const data = await res.json()
        setTopic(data.topic)
        setPosts(data.posts || [])
      }
    } catch (error) {
      console.error("Failed to fetch topic:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTopic()
  }, [slug])

  const handlePostCreated = (newPost: any) => {
    // Add the new post to the beginning of the list
    setPosts([newPost, ...posts])
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-4 lg:p-8 pb-20 lg:pb-8">
          <div className="max-w-4xl mx-auto">
            <Link href="/topics" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
              <ArrowLeft className="h-4 w-4" />
              Back to Topics
            </Link>

            {loading ? (
              <div className="text-center py-12 text-muted-foreground">Loading...</div>
            ) : topic ? (
              <>
                {/* Topic Header */}
                <div className="flex items-start justify-between gap-4 mb-8">
                  <div className="flex items-center gap-4">
                    <div 
                      className="w-16 h-16 rounded-xl flex items-center justify-center text-4xl"
                      style={{ backgroundColor: `${topic.color}20` }}
                    >
                      {topic.icon}
                    </div>
                    <div>
                      <h1 className="text-3xl font-bold">{topic.name}</h1>
                      <p className="text-muted-foreground mt-1">{topic.description}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <span>{posts.length} posts</span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" />
                          {topic.follower_count || 0} followers
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Create Post Button - Always visible */}
                  <CreatePostDialog 
                    topicId={topic.id} 
                    topicName={topic.name}
                    onPostCreated={handlePostCreated}
                  />
                </div>

                {/* Posts List */}
                <div className="space-y-4">
                  {posts.length > 0 ? (
                    posts.map((post) => <PostCard key={post.id} post={post} />)
                  ) : (
                    <div className="text-center py-16 bg-card rounded-xl border border-border">
                      <div 
                        className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center text-5xl"
                        style={{ backgroundColor: `${topic.color}20` }}
                      >
                        {topic.icon}
                      </div>
                      <h3 className="text-xl font-semibold mb-2">No posts yet</h3>
                      <p className="text-muted-foreground mb-6">
                        Be the first to start a discussion in {topic.name}!
                      </p>
                      <CreatePostDialog 
                        topicId={topic.id} 
                        topicName={topic.name}
                        onPostCreated={handlePostCreated}
                        trigger={
                          <Button size="lg" className="gap-2">
                            <Plus className="h-5 w-5" />
                            Create First Post
                          </Button>
                        }
                      />
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <h2 className="text-xl font-semibold mb-2">Topic not found</h2>
                <p className="text-muted-foreground mb-4">The topic you're looking for doesn't exist.</p>
                <Link href="/topics">
                  <Button>Browse Topics</Button>
                </Link>
              </div>
            )}
          </div>
        </main>
      </div>
      <MobileNav />
    </div>
  )
}
