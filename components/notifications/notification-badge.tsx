"use client"

import { useEffect, useState } from "react"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"

interface NotificationBadgeProps {
  onClick: () => void
}

export function NotificationBadge({ onClick }: NotificationBadgeProps) {
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    async function checkNotifications() {
      try {
        const response = await fetch("/api/notifications")
        if (response.ok) {
          const data = await response.json()
          const unread = data.notifications?.filter((n: any) => !n.read).length || 0
          setUnreadCount(unread)
        }
      } catch (err) {
        console.error("Failed to fetch notifications:", err)
      }
    }

    checkNotifications()

    // Poll for new notifications every 30 seconds
    const interval = setInterval(checkNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <Button variant="ghost" size="icon" onClick={onClick} className="relative">
      <Bell className="w-5 h-5" />
      {unreadCount > 0 && (
        <span className="absolute top-0 right-0 w-5 h-5 bg-destructive text-white text-xs rounded-full flex items-center justify-center">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </Button>
  )
}
