"use client"
import { gatewayFetch } from "@/lib/api-client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { MessageSquare, Send, Loader2, Sparkles, X } from "lucide-react"

interface QASource {
  postId: string
  snippet: string
  relevance: number
}

interface AIQAInterfaceProps {
  channelId?: string
  topicId?: string
  className?: string
}

export function AIQAInterface({ channelId, topicId, className = "" }: AIQAInterfaceProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [question, setQuestion] = useState("")
  const [loading, setLoading] = useState(false)
  const [answer, setAnswer] = useState<string | null>(null)
  const [sources, setSources] = useState<QASource[]>([])
  const [confidence, setConfidence] = useState<number>(0)
  const [error, setError] = useState<string | null>(null)

  async function handleAsk() {
    if (question.trim().length < 10) return

    setLoading(true)
    setError(null)
    setAnswer(null)

    try {
      const res = await gatewayFetch("/api/ai/qa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: question.trim(),
          channelId,
          topicId,
          daysBack: 7,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        setAnswer(data.answer)
        setSources(data.sources || [])
        setConfidence(data.confidence || 0)
      } else {
        setError(data.message || "Failed to get answer")
      }
    } catch (err) {
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  function handleClear() {
    setQuestion("")
    setAnswer(null)
    setSources([])
    setError(null)
  }

  if (!isOpen) {
    return (
      <Button
        variant="outline"
        onClick={() => setIsOpen(true)}
        className={`gap-2 border-purple-200 text-purple-700 hover:bg-purple-50 dark:border-purple-800 dark:text-purple-400 dark:hover:bg-purple-950 ${className}`}
      >
        <MessageSquare className="h-4 w-4" />
        Ask AI about this community
      </Button>
    )
  }

  return (
    <div className={`rounded-xl border border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50/50 to-blue-50/50 dark:from-purple-950/30 dark:to-blue-950/30 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-purple-100 dark:border-purple-900">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          <span className="font-medium text-sm">Ask AI</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(false)}
          className="h-7 w-7 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="p-4 space-y-4">
        {/* Question Input */}
        <div className="space-y-2">
          <Textarea
            placeholder="Ask a question about the community discussions... (e.g., 'What are people saying about remote work policies?')"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            rows={2}
            className="resize-none bg-white dark:bg-gray-900 border-purple-100 dark:border-purple-900"
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              Searches the last 7 days of discussions
            </span>
            <div className="flex gap-2">
              {answer && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClear}
                  className="text-muted-foreground"
                >
                  Clear
                </Button>
              )}
              <Button
                size="sm"
                onClick={handleAsk}
                disabled={loading || question.trim().length < 10}
                className="gap-2 bg-purple-600 hover:bg-purple-700 text-white"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Thinking...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Ask
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Answer */}
        {answer && (
          <div className="space-y-3">
            <div className="p-4 bg-white dark:bg-gray-900 rounded-lg border border-purple-100 dark:border-purple-900">
              <p className="text-sm leading-relaxed">{answer}</p>
              
              {confidence > 0 && (
                <div className="mt-3 flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-purple-500 rounded-full transition-all"
                      style={{ width: `${confidence * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {Math.round(confidence * 100)}% confidence
                  </span>
                </div>
              )}
            </div>

            {/* Sources */}
            {sources.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Based on community discussions
                </span>
                <ul className="space-y-1">
                  {sources.slice(0, 3).map((source, index) => (
                    <li 
                      key={index}
                      className="text-xs text-muted-foreground p-2 bg-gray-50 dark:bg-gray-900 rounded"
                    >
                      "{source.snippet}"
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              ⚠️ AI answers are based on community discussions and may not be accurate. No personal information is revealed.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
