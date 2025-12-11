"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Header } from "@/components/layout/header"
import { Sidebar } from "@/components/layout/sidebar"
import { MobileNav } from "@/components/layout/mobile-nav"
import { PostCard } from "@/components/posts/post-card"
import { CreatePostDialog } from "@/components/posts/create-post-dialog"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Building2, Globe, Users, Shield, Plus, Lock, Loader2 } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/hooks/use-auth"

interface Company {
  id: string
  name: string
  domain: string
  verified: boolean
}

export default function CompanyChannelPage() {
  const params = useParams()
  const companyId = params.id as string
  const { user } = useAuth()
  
  const [company, setCompany] = useState<Company | null>(null)
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [hasAccess, setHasAccess] = useState(false)

  useEffect(() => {
    async function fetchCompanyChannel() {
      try {
        const res = await fetch(`/api/companies/${companyId}`)
        if (res.ok) {
          const data = await res.json()
          setCompany(data.company)
          setPosts(data.posts || [])
          setHasAccess(data.hasAccess || false)
        }
      } catch (error) {
        console.error("Failed to fetch company channel:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchCompanyChannel()
  }, [companyId])

  const handlePostCreated = (newPost: any) => {
    setPosts([newPost, ...posts])
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    )
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-8">
            <div className="text-center py-16">
              <Building2 className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-2xl font-bold mb-2">Company not found</h2>
              <p className="text-muted-foreground mb-6">The company channel you're looking for doesn't exist.</p>
              <Link href="/companies">
                <Button>Browse Companies</Button>
              </Link>
            </div>
          </main>
        </div>
        <MobileNav />
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
            <Link href="/companies" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
              <ArrowLeft className="h-4 w-4" />
              Back to Companies
            </Link>

            {/* Company Header */}
            <Card className="p-6 mb-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white text-2xl font-bold">
                    {company.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h1 className="text-2xl font-bold">{company.name}</h1>
                      {company.verified && (
                        <Badge variant="secondary" className="gap-1">
                          <Shield className="h-3 w-3" />
                          Verified
                        </Badge>
                      )}
                    </div>
                    {company.domain && (
                      <div className="flex items-center gap-1 text-muted-foreground mt-1">
                        <Globe className="h-4 w-4" />
                        <span>{company.domain}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {posts.length} posts
                      </span>
                      {!hasAccess && (
                        <span className="flex items-center gap-1 text-yellow-600">
                          <Lock className="h-4 w-4" />
                          Private Channel
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {hasAccess && (
                  <CreatePostDialog
                    channelId={company.id}
                    onPostCreated={handlePostCreated}
                    trigger={
                      <Button className="gap-2">
                        <Plus className="h-4 w-4" />
                        New Post
                      </Button>
                    }
                  />
                )}
              </div>
            </Card>

            {/* Access Required Message */}
            {!hasAccess && (
              <Card className="p-8 mb-6 bg-yellow-50 border-yellow-200">
                <div className="text-center">
                  <Lock className="h-12 w-12 mx-auto mb-4 text-yellow-600" />
                  <h3 className="text-xl font-semibold mb-2">Private Company Channel</h3>
                  <p className="text-muted-foreground mb-4">
                    This channel is only accessible to verified employees of {company.name}.
                  </p>
                  <p className="text-sm text-muted-foreground mb-6">
                    Verify your work email (@{company.domain}) to access this channel.
                  </p>
                  <Link href="/profile">
                    <Button>Verify Your Work Email</Button>
                  </Link>
                </div>
              </Card>
            )}

            {/* Posts */}
            {hasAccess && (
              <div className="space-y-4">
                {posts.length > 0 ? (
                  posts.map((post) => <PostCard key={post.id} post={post} />)
                ) : (
                  <div className="text-center py-16 bg-card rounded-xl border border-border">
                    <Building2 className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <h3 className="text-xl font-semibold mb-2">No posts yet</h3>
                    <p className="text-muted-foreground mb-6">
                      Be the first to start a discussion in the {company.name} channel!
                    </p>
                    <CreatePostDialog
                      channelId={company.id}
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
            )}
          </div>
        </main>
      </div>
      <MobileNav />
    </div>
  )
}

