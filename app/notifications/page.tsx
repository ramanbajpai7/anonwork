"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { formatDistanceToNow } from "date-fns"
import { 
  Bell, 
  MessageCircle, 
  ThumbsUp, 
  AtSign, 
  TrendingUp, 
  Check, 
  Trash2,
  Loader2,
  CheckCheck
} from "lucide-react"
import { Header } from "@/components/layout/header"
import { Sidebar } from "@/components/layout/sidebar"
import { MobileNav } from "@/components/layout/mobile-nav"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/use-auth"

interface Notification {
  id: string
  type: string
  title: string
  body: string | null
  data: {
    postId?: string
    postTitle?: string
    userId?: string
    username?: string
    score?: number
  }
  read: boolean
  created_at: string
}

const notificationIcons: Record<string, React.ReactNode> = {
  comment: <MessageCircle className="h-5 w-5 text-blue-500" />,
  reply: <MessageCircle className="h-5 w-5 text-purple-500" />,
  upvote: <ThumbsUp className="h-5 w-5 text-green-500" />,
  milestone: <TrendingUp className="h-5 w-5 text-yellow-500" />,
  mention: <AtSign className="h-5 w-5 text-pink-500" />,
  message: <MessageCircle className="h-5 w-5 text-indigo-500" />,
}

const notificationLabels: Record<string, string> = {
  comment: "Comment",
  reply: "Reply",
  upvote: "Upvote",
  milestone: "Milestone",
  mention: "Mention",
  message: "Message",
}

export default function NotificationsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [markingRead, setMarkingRead] = useState(false)
  const [filter, setFilter] = useState<"all" | "unread">("all")
  const [unreadCount, setUnreadCount] = useState(0)

  async function fetchNotifications() {
    setLoading(true)
    try {
      const res = await fetch(`/api/notifications?limit=50${filter === "unread" ? "&unread=true" : ""}`)
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications || [])
        setUnreadCount(data.unreadCount || 0)
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      fetchNotifications()
    }
  }, [user, filter])

  async function markAllAsRead() {
    setMarkingRead(true)
    try {
      const res = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mark_all: true }),
      })
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })))
        setUnreadCount(0)
      }
    } catch (error) {
      console.error("Failed to mark all as read:", error)
    } finally {
      setMarkingRead(false)
    }
  }

  async function markAsRead(notificationId: string) {
    try {
      await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notification_ids: [notificationId] }),
      })
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error("Failed to mark as read:", error)
    }
  }

  async function deleteNotification(notificationId: string) {
    try {
      await fetch("/api/notifications", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notification_id: notificationId }),
      })
      setNotifications(prev => prev.filter(n => n.id !== notificationId))
    } catch (error) {
      console.error("Failed to delete notification:", error)
    }
  }

  function handleNotificationClick(notification: Notification) {
    if (!notification.read) {
      markAsRead(notification.id)
    }
    
    if (notification.data?.postId) {
      router.push(`/posts/${notification.data.postId}`)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-4 lg:p-8 pb-20 lg:pb-8">
          <div className="max-w-3xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <Bell className="h-6 w-6" />
                  Notifications
                </h1>
                {unreadCount > 0 && (
                  <p className="text-sm text-muted-foreground mt-1">
                    You have {unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}
                  </p>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <div className="flex bg-muted rounded-lg p-1">
                  <button
                    onClick={() => setFilter("all")}
                    className={cn(
                      "px-3 py-1.5 text-sm rounded-md transition-colors",
                      filter === "all" 
                        ? "bg-background shadow text-foreground" 
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setFilter("unread")}
                    className={cn(
                      "px-3 py-1.5 text-sm rounded-md transition-colors",
                      filter === "unread" 
                        ? "bg-background shadow text-foreground" 
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Unread
                  </button>
                </div>
                
                {unreadCount > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={markAllAsRead}
                    disabled={markingRead}
                    className="gap-2"
                  >
                    {markingRead ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCheck className="h-4 w-4" />
                    )}
                    Mark all read
                  </Button>
                )}
              </div>
            </div>

            {/* Notifications list */}
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              {loading ? (
                <div className="p-8 text-center text-muted-foreground">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3" />
                  Loading notifications...
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground">
                  <Bell className="h-16 w-16 mx-auto mb-4 opacity-30" />
                  <h3 className="text-lg font-medium mb-2">
                    {filter === "unread" ? "No unread notifications" : "No notifications yet"}
                  </h3>
                  <p className="text-sm">
                    {filter === "unread" 
                      ? "You're all caught up! 🎉" 
                      : "We'll notify you when someone interacts with your posts"}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={cn(
                        "flex items-start gap-4 p-4 transition-colors hover:bg-muted/50",
                        !notification.read && "bg-primary/5"
                      )}
                    >
                      {/* Icon */}
                      <div className="shrink-0 w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                        {notificationIcons[notification.type] || <Bell className="h-5 w-5" />}
                      </div>

                      {/* Content */}
                      <button
                        onClick={() => handleNotificationClick(notification)}
                        className="flex-1 text-left min-w-0"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className={cn(
                              "text-xs px-2 py-0.5 rounded-full",
                              notification.type === "milestone" ? "bg-yellow-100 text-yellow-700" :
                              notification.type === "mention" ? "bg-pink-100 text-pink-700" :
                              notification.type === "upvote" ? "bg-green-100 text-green-700" :
                              "bg-blue-100 text-blue-700"
                            )}>
                              {notificationLabels[notification.type] || notification.type}
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground shrink-0">
                            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                          </span>
                        </div>
                        
                        <p className={cn(
                          "text-sm mt-1",
                          !notification.read && "font-semibold"
                        )}>
                          {notification.title}
                        </p>
                        
                        {notification.body && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {notification.body}
                          </p>
                        )}
                      </button>

                      {/* Actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        {!notification.read && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => markAsRead(notification.id)}
                            title="Mark as read"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => deleteNotification(notification.id)}
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
      <MobileNav />
    </div>
  )
}




