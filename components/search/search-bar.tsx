"use client"

import { useState, useRef, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { SearchIcon } from "lucide-react"
import Link from "next/link"

interface SearchResult {
  id: string
  title?: string
  body?: string
  name?: string
  type?: string
  score?: number
  author?: { anon_username: string }
}

export function SearchBar() {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [showResults, setShowResults] = useState(false)
  const [loading, setLoading] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)

    if (!query.trim()) {
      setResults([])
      return
    }

    setLoading(true)
    timeoutRef.current = setTimeout(async () => {
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&limit=8`)
        if (response.ok) {
          const data = await response.json()
          setResults(data.results || [])
        }
      } catch (err) {
        console.error("Search failed:", err)
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [query])

  return (
    <div className="relative flex-1 max-w-md">
      <div className="relative">
        <Input
          placeholder="Search posts, companies..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setShowResults(true)
          }}
          onFocus={() => setShowResults(true)}
          className="pl-10"
        />
        <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
      </div>

      {/* Results Dropdown */}
      {showResults && query.trim() && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-muted-foreground">Searching...</div>
          ) : results.length > 0 ? (
            results.map((result) => (
              <Link key={result.id} href={`/posts/${result.id}`} onClick={() => setShowResults(false)}>
                <div className="p-3 hover:bg-muted border-b border-border last:border-b-0 cursor-pointer">
                  <h4 className="font-medium text-sm">
                    {result.title || result.name || result.body?.substring(0, 50)}
                  </h4>
                  {result.author && <p className="text-xs text-muted-foreground">by {result.author.anon_username}</p>}
                </div>
              </Link>
            ))
          ) : (
            <div className="p-4 text-center text-muted-foreground">No results found</div>
          )}
        </div>
      )}
    </div>
  )
}
