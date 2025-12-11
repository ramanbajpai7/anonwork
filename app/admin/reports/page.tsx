"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/hooks/use-auth"
import { redirect } from "next/navigation"
import type { Report } from "@/lib/types"
import { ReportCard } from "@/components/admin/report-card"
import { Button } from "@/components/ui/button"

export default function AdminReportsPage() {
  const { user } = useAuth()
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState("open")

  useEffect(() => {
    if (user && user.role !== "admin") {
      redirect("/dashboard")
    }
  }, [user])

  useEffect(() => {
    async function fetchReports() {
      try {
        const response = await fetch(`/api/admin/reports?status=${filterStatus}&limit=50`)
        if (response.ok) {
          const data = await response.json()
          setReports(data.reports || [])
        }
      } catch (err) {
        console.error("Failed to fetch reports:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchReports()
  }, [filterStatus])

  function handleReportAction() {
    // Refresh reports
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
    }, 1000)
  }

  if (!user) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  if (user.role !== "admin") {
    return <div className="flex items-center justify-center min-h-screen">Access Denied</div>
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold mb-4">Reports & Moderation</h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          {["open", "reviewed", "actioned"].map((status) => (
            <Button
              key={status}
              variant={filterStatus === status ? "default" : "outline"}
              onClick={() => setFilterStatus(status)}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Button>
          ))}
        </div>

        {/* Reports Grid */}
        <div>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading reports...</div>
          ) : reports.length > 0 ? (
            <div className="grid gap-4">
              {reports.map((report) => (
                <ReportCard key={report.id} report={report as any} onAction={handleReportAction} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">No reports found</div>
          )}
        </div>
      </div>
    </div>
  )
}
