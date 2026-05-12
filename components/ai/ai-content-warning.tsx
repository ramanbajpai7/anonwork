"use client"
import { gatewayFetch } from "@/lib/api-client"

import { useState, useEffect } from "react"
import { AlertTriangle, Shield, CheckCircle, Loader2, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface PrivacyWarning {
  type: string
  message: string
  severity: "info" | "warning" | "critical"
  suggestion: string
}

interface AIContentWarningProps {
  text: string
  onCheck?: (result: { safe: boolean; warnings: PrivacyWarning[] }) => void
  autoCheck?: boolean
  debounceMs?: number
  className?: string
}

export function AIContentWarning({
  text,
  onCheck,
  autoCheck = false,
  debounceMs = 1000,
  className = "",
}: AIContentWarningProps) {
  const [loading, setLoading] = useState(false)
  const [checked, setChecked] = useState(false)
  const [safe, setSafe] = useState(true)
  const [warnings, setWarnings] = useState<PrivacyWarning[]>([])
  const [dismissed, setDismissed] = useState(false)

  // Auto-check when text changes (debounced)
  useEffect(() => {
    if (!autoCheck || text.length < 50) return

    const timer = setTimeout(() => {
      checkContent()
    }, debounceMs)

    return () => clearTimeout(timer)
  }, [text, autoCheck])

  async function checkContent() {
    if (text.length < 10) return

    setLoading(true)
    setDismissed(false)

    try {
      const res = await gatewayFetch("/api/ai/check-privacy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      })

      const data = await res.json()

      if (res.ok) {
        setSafe(data.safe)
        setWarnings(data.warnings || [])
        setChecked(true)
        onCheck?.({ safe: data.safe, warnings: data.warnings || [] })
      }
    } catch (err) {
      console.error("Privacy check failed:", err)
    } finally {
      setLoading(false)
    }
  }

  // Don't show if dismissed or no content
  if (dismissed || text.length < 10) {
    return null
  }

  // Loading state
  if (loading) {
    return (
      <div className={`flex items-center gap-2 text-sm text-muted-foreground ${className}`}>
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Checking for personal info...</span>
      </div>
    )
  }

  // Show check button if auto-check is off and hasn't been checked
  if (!autoCheck && !checked) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={checkContent}
        className={`gap-2 text-muted-foreground hover:text-foreground ${className}`}
      >
        <Shield className="h-4 w-4" />
        Check for personal info
      </Button>
    )
  }

  // All clear
  if (checked && safe && warnings.length === 0) {
    return (
      <div className={`flex items-center gap-2 text-sm text-green-600 dark:text-green-400 ${className}`}>
        <CheckCircle className="h-4 w-4" />
        <span>No personal info detected</span>
      </div>
    )
  }

  // Warnings present
  if (warnings.length > 0) {
    const criticalWarnings = warnings.filter(w => w.severity === "critical")
    const otherWarnings = warnings.filter(w => w.severity !== "critical")

    return (
      <div className={`rounded-lg border ${
        criticalWarnings.length > 0 
          ? "bg-red-50 border-red-200 dark:bg-red-950/50 dark:border-red-900" 
          : "bg-amber-50 border-amber-200 dark:bg-amber-950/50 dark:border-amber-900"
      } ${className}`}>
        <div className="p-3">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-2">
              <AlertTriangle className={`h-4 w-4 mt-0.5 ${
                criticalWarnings.length > 0 
                  ? "text-red-600 dark:text-red-400" 
                  : "text-amber-600 dark:text-amber-400"
              }`} />
              <div>
                <p className={`text-sm font-medium ${
                  criticalWarnings.length > 0 
                    ? "text-red-700 dark:text-red-300" 
                    : "text-amber-700 dark:text-amber-300"
                }`}>
                  {criticalWarnings.length > 0 
                    ? "Personal information detected!" 
                    : "Privacy suggestions"}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Review these items before posting
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setDismissed(true)}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <ul className="mt-3 space-y-2">
            {criticalWarnings.map((warning, index) => (
              <li key={`critical-${index}`} className="flex items-start gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 mt-1.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-red-700 dark:text-red-300">{warning.message}</p>
                  <p className="text-xs text-red-600/70 dark:text-red-400/70">{warning.suggestion}</p>
                </div>
              </li>
            ))}
            {otherWarnings.map((warning, index) => (
              <li key={`other-${index}`} className="flex items-start gap-2">
                <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                  warning.severity === "warning" ? "bg-amber-500" : "bg-blue-500"
                }`} />
                <div>
                  <p className="text-sm text-foreground/80">{warning.message}</p>
                  <p className="text-xs text-muted-foreground">{warning.suggestion}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    )
  }

  return null
}
