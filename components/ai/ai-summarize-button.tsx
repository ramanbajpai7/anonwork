"use client"
import { gatewayFetch } from "@/lib/api-client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Sparkles, Loader2, ChevronDown, ChevronUp, AlertCircle } from "lucide-react"

interface AISummarizeButtonProps {
  postId: string
  className?: string
}

interface SummaryResult {
  summary: string
  bulletPoints: string[]
  keyTopics: string[]
  wordCount: number
}

export function AISummarizeButton({ postId, className = "" }: AISummarizeButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [summary, setSummary] = useState<SummaryResult | null>(null)
  const [expanded, setExpanded] = useState(true)

  async function handleSummarize() {
    if (summary) {
      setExpanded(!expanded)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await gatewayFetch("/api/ai/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId }),
      })

      const data = await res.json()

      if (res.ok) {
        setSummary({
          summary: data.summary,
          bulletPoints: data.bulletPoints || [],
          keyTopics: data.keyTopics || [],
          wordCount: data.wordCount || 0,
        })
      } else {
        setError(data.message || "Failed to generate summary")
      }
    } catch (err) {
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`${className}`}>
      <Button
        variant="outline"
        size="sm"
        onClick={handleSummarize}
        disabled={loading}
        className="gap-2 border-purple-200 text-purple-700 hover:bg-purple-50 hover:text-purple-800 dark:border-purple-800 dark:text-purple-400 dark:hover:bg-purple-950"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Summarizing...
          </>
        ) : summary ? (
          <>
            <Sparkles className="h-4 w-4" />
            AI Summary
            {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" />
            Summarize Thread
          </>
        )}
      </Button>

      {error && (
        <div className="mt-3 p-3 bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 rounded-lg text-sm flex items-start gap-2">
          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          {error}
        </div>
      )}

      {summary && expanded && (
        <div className="mt-3 p-4 rounded-lg bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/50 dark:to-blue-950/50 border border-purple-100 dark:border-purple-900">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
              AI-Generated Summary
            </span>
            <span className="text-xs text-muted-foreground">
              ({summary.wordCount} words analyzed)
            </span>
          </div>

          <p className="text-sm text-foreground/90 mb-4">{summary.summary}</p>

          {summary.bulletPoints.length > 0 && (
            <div className="space-y-2 mb-4">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Key Points
              </span>
              <ul className="space-y-1.5">
                {summary.bulletPoints.map((point, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <span className="text-purple-600 dark:text-purple-400 mt-1">•</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {summary.keyTopics.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-muted-foreground">Topics:</span>
              {summary.keyTopics.map((topic, index) => (
                <span
                  key={index}
                  className="px-2 py-0.5 text-xs rounded-full bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300"
                >
                  {topic}
                </span>
              ))}
            </div>
          )}

          <p className="text-xs text-muted-foreground mt-4 pt-3 border-t border-purple-100 dark:border-purple-900">
            ⚠️ AI-generated summary may not be fully accurate. Always read the full discussion for complete context.
          </p>
        </div>
      )}
    </div>
  )
}
