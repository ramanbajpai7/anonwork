"use client"

import { useEffect, useState } from "react"
import { Header } from "@/components/layout/header"
import { Sidebar } from "@/components/layout/sidebar"
import { MobileNav } from "@/components/layout/mobile-nav"
import { PostCard } from "@/components/posts/post-card"
import { Bookmark, Loader2 } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { redirect } from "next/navigation"

export default function BookmarksPage() {
  const { user, loading: authLoading } = useAuth()
  const [bookmarks, setBookmarks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !user) {
      redirect("/login")
    }
  }, [user, authLoading])

  useEffect(() => {
    async function fetchBookmarks() {
      try {
        const res = await fetch("/api/bookmarks")
        if (res.ok) {
          const data = await res.json()
          // Transform bookmarks to include bookmark_id for the PostCard
          const transformedBookmarks = (data.bookmarks || []).map((b: any) => ({
            ...b,
            bookmark_id: b.bookmark_id,
            author: {
              anon_username: b.author_anon_username,
              is_verified_employee: b.author_is_verified,
            },
            topic: b.topic_name ? {
              name: b.topic_name,
              slug: b.topic_slug,
            } : null,
          }))
          setBookmarks(transformedBookmarks)
        }
      } catch (error) {
        console.error("Failed to fetch bookmarks:", error)
      } finally {
        setLoading(false)
      }
    }
    
    if (user) {
      fetchBookmarks()
    }
  }, [user])

  const handleBookmarkChange = (postId: string, isBookmarked: boolean) => {
    if (!isBookmarked) {
      // Remove the bookmark from the list
      setBookmarks(bookmarks.filter(b => b.id !== postId))
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-4 lg:p-8 pb-20 lg:pb-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold flex items-center gap-2 mb-2">
              <Bookmark className="h-8 w-8 text-yellow-500" />
              Saved Posts
            </h1>
            <p className="text-muted-foreground mb-8">Posts you've bookmarked for later</p>

            {loading ? (
              <div className="text-center py-12 text-muted-foreground">
                <Loader2 className="h-8 w-8 mx-auto mb-4 animate-spin" />
                Loading saved posts...
              </div>
            ) : bookmarks.length > 0 ? (
              <div className="space-y-4">
                {bookmarks.map((bookmark) => (
                  <PostCard 
                    key={bookmark.id} 
                    post={{ ...bookmark, bookmark_id: bookmark.bookmark_id }} 
                    onBookmarkChange={(isBookmarked) => handleBookmarkChange(bookmark.id, isBookmarked)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-card rounded-xl border border-border">
                <Bookmark className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-xl font-semibold mb-2">No saved posts</h3>
                <p className="text-muted-foreground">
                  Click the bookmark icon on any post to save it for later
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
      <MobileNav />
    </div>
  )
}
