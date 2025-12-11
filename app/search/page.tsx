"use client"

import { useState } from "react"
import { Header } from "@/components/layout/header"
import { Sidebar } from "@/components/layout/sidebar"
import { MobileNav } from "@/components/layout/mobile-nav"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search as SearchIcon, FileText, Building2, User, Hash } from "lucide-react"
import Link from "next/link"

export default function SearchPage() {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<any>({})
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim() || query.length < 2) return

    setLoading(true)
    setSearched(true)
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
      if (res.ok) {
        const data = await res.json()
        setResults(data.results || {})
      }
    } catch (error) {
      console.error("Search failed:", error)
    } finally {
      setLoading(false)
    }
  }

  const totalResults = (results.posts?.length || 0) + (results.companies?.length || 0) + 
                       (results.users?.length || 0) + (results.topics?.length || 0)

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-4 lg:p-8 pb-20 lg:pb-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">Search</h1>

            <form onSubmit={handleSearch} className="mb-8">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    placeholder="Search posts, companies, users, topics..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button type="submit" disabled={loading}>
                  {loading ? "Searching..." : "Search"}
                </Button>
              </div>
            </form>

            {searched && (
              <>
                <p className="text-muted-foreground mb-4">
                  {loading ? "Searching..." : `Found ${totalResults} results for "${query}"`}
                </p>

                <Tabs defaultValue="all">
                  <TabsList className="mb-4">
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="posts">Posts ({results.posts?.length || 0})</TabsTrigger>
                    <TabsTrigger value="companies">Companies ({results.companies?.length || 0})</TabsTrigger>
                    <TabsTrigger value="topics">Topics ({results.topics?.length || 0})</TabsTrigger>
                  </TabsList>

                  <TabsContent value="all" className="space-y-4">
                    {results.posts?.slice(0, 5).map((post: any) => (
                      <Link key={post.id} href={`/posts/${post.id}`}>
                        <Card className="p-4 hover:bg-muted/50 transition-colors">
                          <div className="flex items-start gap-3">
                            <FileText className="h-5 w-5 text-muted-foreground mt-1" />
                            <div>
                              <h3 className="font-medium">{post.title || "Untitled Post"}</h3>
                              <p className="text-sm text-muted-foreground line-clamp-2">{post.body}</p>
                              <div className="text-xs text-muted-foreground mt-1">
                                by {post.author_anon_username} • {post.topic_name && `in ${post.topic_name}`}
                              </div>
                            </div>
                          </div>
                        </Card>
                      </Link>
                    ))}
                    
                    {results.companies?.slice(0, 3).map((company: any) => (
                      <Card key={company.id} className="p-4">
                        <div className="flex items-center gap-3">
                          <Building2 className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <h3 className="font-medium">{company.name}</h3>
                            <p className="text-sm text-muted-foreground">{company.domain}</p>
                          </div>
                          {company.verified && (
                            <span className="ml-auto text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">Verified</span>
                          )}
                        </div>
                      </Card>
                    ))}

                    {results.topics?.slice(0, 3).map((topic: any) => (
                      <Link key={topic.id} href={`/topics/${topic.slug}`}>
                        <Card className="p-4 hover:bg-muted/50 transition-colors">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{topic.icon}</span>
                            <div>
                              <h3 className="font-medium">{topic.name}</h3>
                              <p className="text-sm text-muted-foreground">{topic.description}</p>
                            </div>
                          </div>
                        </Card>
                      </Link>
                    ))}

                    {totalResults === 0 && !loading && (
                      <div className="text-center py-12 text-muted-foreground">
                        <SearchIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No results found for "{query}"</p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="posts" className="space-y-4">
                    {results.posts?.map((post: any) => (
                      <Link key={post.id} href={`/posts/${post.id}`}>
                        <Card className="p-4 hover:bg-muted/50 transition-colors">
                          <h3 className="font-medium">{post.title || "Untitled Post"}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{post.body}</p>
                          <div className="text-xs text-muted-foreground mt-2">
                            by {post.author_anon_username} • Score: {post.score}
                          </div>
                        </Card>
                      </Link>
                    ))}
                  </TabsContent>

                  <TabsContent value="companies" className="space-y-4">
                    {results.companies?.map((company: any) => (
                      <Card key={company.id} className="p-4">
                        <div className="flex items-center gap-3">
                          <Building2 className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <h3 className="font-medium">{company.name}</h3>
                            <p className="text-sm text-muted-foreground">{company.domain}</p>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </TabsContent>

                  <TabsContent value="topics" className="space-y-4">
                    {results.topics?.map((topic: any) => (
                      <Link key={topic.id} href={`/topics/${topic.slug}`}>
                        <Card className="p-4 hover:bg-muted/50 transition-colors">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{topic.icon}</span>
                            <div>
                              <h3 className="font-medium">{topic.name}</h3>
                              <p className="text-sm text-muted-foreground">{topic.description}</p>
                              <p className="text-xs text-muted-foreground mt-1">{topic.post_count} posts</p>
                            </div>
                          </div>
                        </Card>
                      </Link>
                    ))}
                  </TabsContent>
                </Tabs>
              </>
            )}

            {!searched && (
              <div className="text-center py-12 text-muted-foreground">
                <SearchIcon className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p>Search for posts, companies, users, or topics</p>
              </div>
            )}
          </div>
        </main>
      </div>
      <MobileNav />
    </div>
  )
}
