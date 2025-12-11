"use client"

import { useEffect, useState } from "react"
import { Header } from "@/components/layout/header"
import { Sidebar } from "@/components/layout/sidebar"
import { MobileNav } from "@/components/layout/mobile-nav"
import { Card } from "@/components/ui/card"
import Link from "next/link"

interface Topic {
  id: string
  name: string
  slug: string
  description: string
  icon: string
  color: string
  post_count: number
  follower_count: number
}

export default function TopicsPage() {
  const [topics, setTopics] = useState<Topic[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchTopics() {
      try {
        const res = await fetch("/api/topics")
        if (res.ok) {
          const data = await res.json()
          setTopics(data.topics || [])
        }
      } catch (error) {
        console.error("Failed to fetch topics:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchTopics()
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-4 lg:p-8 pb-20 lg:pb-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-2">Topics</h1>
            <p className="text-muted-foreground mb-8">
              Browse discussions by topic. Join conversations that interest you.
            </p>

            {loading ? (
              <div className="text-center py-12 text-muted-foreground">Loading topics...</div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {topics.map((topic) => (
                  <Link key={topic.id} href={`/topics/${topic.slug}`}>
                    <Card className="p-5 hover:shadow-lg transition-shadow cursor-pointer border-l-4" style={{ borderLeftColor: topic.color }}>
                      <div className="flex items-start gap-4">
                        <div className="text-3xl">{topic.icon}</div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{topic.name}</h3>
                          <p className="text-sm text-muted-foreground mt-1">{topic.description}</p>
                          <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
                            <span>{topic.post_count || 0} posts</span>
                            <span>{topic.follower_count || 0} followers</span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
      <MobileNav />
    </div>
  )
}

