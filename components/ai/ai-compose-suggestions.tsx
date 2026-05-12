"use client"
import { gatewayFetch } from "@/lib/api-client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Sparkles, Loader2, ChevronDown, ChevronUp, RefreshCw } from "lucide-react"

interface TitleSuggestion {
  title: string
  style: string
}

interface TagSuggestion {
  id: string | null
  name: string
  slug: string
  confidence: number
  isExisting: boolean
  icon?: string | null
}

interface AIComposeSuggestionsProps {
  content: string
  currentTitle?: string
  onSelectTitle?: (title: string) => void
  onSelectTag?: (tag: TagSuggestion) => void
  showTitles?: boolean
  showTags?: boolean
  className?: string
}

export function AIComposeSuggestions({
  content,
  currentTitle = "",
  onSelectTitle,
  onSelectTag,
  showTitles = true,
  showTags = true,
  className = "",
}: AIComposeSuggestionsProps) {
  const [expanded, setExpanded] = useState(false)
  const [titleLoading, setTitleLoading] = useState(false)
  const [tagLoading, setTagLoading] = useState(false)
  const [titleSuggestions, setTitleSuggestions] = useState<TitleSuggestion[]>([])
  const [tagSuggestions, setTagSuggestions] = useState<TagSuggestion[]>([])
  const [error, setError] = useState<string | null>(null)

  const minContentLength = 20

  async function fetchTitleSuggestions() {
    if (content.length < minContentLength) return

    setTitleLoading(true)
    setError(null)

    try {
      const res = await gatewayFetch("/api/ai/suggest-title", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      })

      const data = await res.json()

      if (res.ok) {
        setTitleSuggestions(data.suggestions || [])
      } else {
        setError(data.message)
      }
    } catch (err) {
      setError("Failed to get suggestions")
    } finally {
      setTitleLoading(false)
    }
  }

  async function fetchTagSuggestions() {
    if (content.length < minContentLength) return

    setTagLoading(true)
    setError(null)

    try {
      const res = await gatewayFetch("/api/ai/suggest-tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: currentTitle, content }),
      })

      const data = await res.json()

      if (res.ok) {
        setTagSuggestions(data.tags || [])
      } else {
        setError(data.message)
      }
    } catch (err) {
      setError("Failed to get suggestions")
    } finally {
      setTagLoading(false)
    }
  }

  async function handleExpand() {
    if (!expanded) {
      setExpanded(true)
      if (showTitles && titleSuggestions.length === 0) {
        fetchTitleSuggestions()
      }
      if (showTags && tagSuggestions.length === 0) {
        fetchTagSuggestions()
      }
    } else {
      setExpanded(false)
    }
  }

  const styleColors: Record<string, string> = {
    professional: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
    engaging: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
    concise: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  }

  if (content.length < minContentLength) {
    return null
  }

  return (
    <div className={`${className}`}>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={handleExpand}
        className="gap-2 text-purple-600 hover:text-purple-700 hover:bg-purple-50 dark:text-purple-400 dark:hover:bg-purple-950"
      >
        <Sparkles className="h-4 w-4" />
        AI Suggestions
        {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </Button>

      {expanded && (
        <div className="mt-3 p-4 rounded-lg bg-gradient-to-br from-purple-50/50 to-blue-50/50 dark:from-purple-950/30 dark:to-blue-950/30 border border-purple-100 dark:border-purple-900 space-y-4">
          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}

          {/* Title Suggestions */}
          {showTitles && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">Suggested Titles</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={fetchTitleSuggestions}
                  disabled={titleLoading}
                  className="h-7 px-2"
                >
                  {titleLoading ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3 w-3" />
                  )}
                </Button>
              </div>
              
              {titleLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating titles...
                </div>
              ) : titleSuggestions.length > 0 ? (
                <div className="space-y-2">
                  {titleSuggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => onSelectTitle?.(suggestion.title)}
                      className="w-full text-left p-2 rounded-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700 transition-colors group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm group-hover:text-purple-600 dark:group-hover:text-purple-400">
                          {suggestion.title}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${styleColors[suggestion.style] || styleColors.professional}`}>
                          {suggestion.style}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Click refresh to get title suggestions</p>
              )}
            </div>
          )}

          {/* Tag Suggestions */}
          {showTags && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">Suggested Topics</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={fetchTagSuggestions}
                  disabled={tagLoading}
                  className="h-7 px-2"
                >
                  {tagLoading ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3 w-3" />
                  )}
                </Button>
              </div>
              
              {tagLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Finding relevant topics...
                </div>
              ) : tagSuggestions.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {tagSuggestions.map((tag, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => onSelectTag?.(tag)}
                      className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                        tag.isExisting
                          ? "bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-900 dark:text-purple-300 dark:hover:bg-purple-800"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                      }`}
                    >
                      {tag.icon && <span className="mr-1">{tag.icon}</span>}
                      {tag.name}
                      <span className="ml-1 text-xs opacity-60">
                        {Math.round(tag.confidence * 100)}%
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Click refresh to get topic suggestions</p>
              )}
            </div>
          )}

          <p className="text-xs text-muted-foreground pt-2 border-t border-purple-100 dark:border-purple-900">
            💡 Click a suggestion to use it. AI suggestions are optional.
          </p>
        </div>
      )}
    </div>
  )
}
