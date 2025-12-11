"use client"

import type { Report } from "@/lib/types"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatDistanceToNow } from "date-fns"

interface ReportCardProps {
  report: Report & {
    reporter?: { id: string; anon_username: string }
    target_post?: { id: string; title?: string; body: string }
  }
  onAction?: () => void
}

export function ReportCard({ report, onAction }: ReportCardProps) {
  const [actionLoading, setActionLoading] = useState(false)

  async function handleAction(action: string) {
    setActionLoading(true)

    try {
      const response = await fetch(`/api/admin/reports/${report.id}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reason: "" }),
      })

      if (response.ok) {
        onAction?.()
      }
    } catch (err) {
      console.error("Action failed:", err)
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-base">Report from {report.reporter?.anon_username}</CardTitle>
            <CardDescription>{report.reason}</CardDescription>
          </div>
          <span
            className={`text-xs px-2 py-1 rounded font-semibold ${
              report.status === "open"
                ? "bg-yellow-100 text-yellow-700"
                : report.status === "reviewed"
                  ? "bg-blue-100 text-blue-700"
                  : "bg-green-100 text-green-700"
            }`}
          >
            {report.status.toUpperCase()}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {report.target_post && (
          <div className="bg-muted p-3 rounded">
            <p className="text-sm font-medium mb-1">{report.target_post.title}</p>
            <p className="text-sm text-muted-foreground line-clamp-3">{report.target_post.body}</p>
          </div>
        )}

        <div className="flex justify-between items-center text-xs text-muted-foreground">
          <span>Reported {formatDistanceToNow(new Date(report.created_at), { addSuffix: true })}</span>
        </div>

        {report.status === "open" && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAction("approve")}
              disabled={actionLoading}
              className="flex-1"
            >
              Approve
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleAction("remove")}
              disabled={actionLoading}
              className="flex-1"
            >
              Remove Post
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
