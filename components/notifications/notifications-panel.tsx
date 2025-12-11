"use client"

import { useEffect, useState } from "react"
import type { Notification } from "@/lib/types"
import { formatDistanceToNow } from "date-fns"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface NotificationsPanelProps {
  onClose: () => void
}

export function NotificationsPanel({ onClose }: NotificationsPanelProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchNotifications() {
      try {
        const response = await fetch("/api/notifications?limit=20")
        if (response.ok) {
          const data = await response.json()
          setNotifications(data.notifications || [])
        }
      } catch (err) {
        console.error("Failed to fetch notifications:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchNotifications()
  }, [])

  async function handleMarkAsRead(notificationId: string) {
    try {
      await fetch(`/api/notifications/${notificationId}/read`, { method: "PATCH" })
      setNotifications(notifications.map((n) => (n.id === notificationId ? { ...n, read: true } : n)))
    } catch (err) {
      console.error("Failed to mark as read:", err)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-end z-50">
      <div className="bg-background w-full max-w-md h-screen flex flex-col shadow-lg">
        {/* Header */}
        <div className="border-b border-border p-4 flex justify-between items-center">
          <h2 className="text-lg font-semibold">Notifications</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-muted-foreground">Loading...</div>
          ) : notifications.length > 0 ? (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 border-b border-border cursor-pointer hover:bg-muted transition-colors ${
                  !notification.read ? "bg-muted/50" : ""
                }`}
                onClick={() => handleMarkAsRead(notification.id)}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="font-medium capitalize text-sm">{notification.type}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{JSON.stringify(notification.payload)}</p>
              </div>
            ))
          ) : (
            <div className="p-4 text-center text-muted-foreground">No notifications</div>
          )}
        </div>
      </div>
    </div>
  )
}
