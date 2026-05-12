"use client"
import { gatewayFetch } from "@/lib/api-client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Wand2, Loader2, Check, Copy, RotateCcw } from "lucide-react"

interface AIRewriteHelperProps {
  text: string
  onRewrite?: (newText: string) => void
  className?: string
}

export function AIRewriteHelper({ text, onRewrite, className = "" }: AIRewriteHelperProps) {
  const [loading, setLoading] = useState(false)
  const [rewritten, setRewritten] = useState<string | null>(null)
  const [changes, setChanges] = useState<string[]>([])
  const [selectedStyle, setSelectedStyle] = useState<"professional" | "clear" | "concise">("professional")
  const [showRewrite, setShowRewrite] = useState(false)
  const [copied, setCopied] = useState(false)

  async function handleRewrite() {
    if (text.length < 20) return

    setLoading(true)

    try {
      const res = await gatewayFetch("/api/ai/rewrite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, style: selectedStyle }),
      })

      const data = await res.json()

      if (res.ok) {
        setRewritten(data.rewritten)
        setChanges(data.changes || [])
        setShowRewrite(true)
      }
    } catch (err) {
      console.error("Rewrite failed:", err)
    } finally {
      setLoading(false)
    }
  }

  function handleUseRewrite() {
    if (rewritten) {
      onRewrite?.(rewritten)
      setShowRewrite(false)
      setRewritten(null)
    }
  }

  function handleCopy() {
    if (rewritten) {
      navigator.clipboard.writeText(rewritten)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (text.length < 20) {
    return null
  }

  const styles = [
    { value: "professional" as const, label: "Professional", desc: "Formal and polished" },
    { value: "clear" as const, label: "Clear", desc: "Simple and readable" },
    { value: "concise" as const, label: "Concise", desc: "Brief and direct" },
  ]

  return (
    <div className={className}>
      {!showRewrite ? (
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex gap-1">
            {styles.map((style) => (
              <button
                key={style.value}
                type="button"
                onClick={() => setSelectedStyle(style.value)}
                className={`px-2 py-1 text-xs rounded-md transition-colors ${
                  selectedStyle === style.value
                    ? "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
                }`}
                title={style.desc}
              >
                {style.label}
              </button>
            ))}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleRewrite}
            disabled={loading}
            className="gap-2 text-purple-600 hover:text-purple-700 hover:bg-purple-50 dark:text-purple-400 dark:hover:bg-purple-950"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Rewriting...
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4" />
                Improve Writing
              </>
            )}
          </Button>
        </div>
      ) : (
        <div className="space-y-3 p-4 rounded-lg bg-purple-50 dark:bg-purple-950/50 border border-purple-100 dark:border-purple-900">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wand2 className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
                AI Rewrite ({selectedStyle})
              </span>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowRewrite(false)}
              className="h-7 text-xs"
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Cancel
            </Button>
          </div>

          <div className="p-3 bg-white dark:bg-gray-900 rounded-md border border-purple-100 dark:border-purple-800">
            <p className="text-sm whitespace-pre-wrap">{rewritten}</p>
          </div>

          {changes.length > 0 && (
            <ul className="text-xs text-muted-foreground space-y-1">
              {changes.map((change, index) => (
                <li key={index} className="flex items-center gap-1">
                  <Check className="h-3 w-3 text-green-500" />
                  {change}
                </li>
              ))}
            </ul>
          )}

          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              onClick={handleUseRewrite}
              className="gap-2 bg-purple-600 hover:bg-purple-700 text-white"
            >
              <Check className="h-4 w-4" />
              Use This Version
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="gap-2"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
