"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { formatDistanceToNow } from "date-fns"
import { MessageSquare, ChevronRight, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"

interface Conversation {
  id: string
  type: string
  other_participants: {
    user_id: string
    anon_username: string
    display_name?: string | null
    profile_photo_url?: string | null
  }[] | null
  updated_at: string
  last_message?: string
}

export function MessagesWidget() {
  const { user } = useAuth()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    
    async function fetchRecentConversations() {
      try {
        const res = await fetch("/api/messages?limit=3")
        if (res.ok) {
          const data = await res.json()
          setConversations(data.conversations?.slice(0, 3) || [])
        }
      } catch (error) {
        console.error("Failed to fetch conversations:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchRecentConversations()
  }, [user])

  if (!user) return null

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-primary" />
          Recent Messages
        </h3>
        <Link href="/messages">
          <Button variant="ghost" size="sm" className="h-7 text-xs">
            View All
            <ChevronRight className="h-3 w-3 ml-1" />
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="text-xs text-muted-foreground py-3 text-center">Loading...</div>
      ) : conversations.length > 0 ? (
        <div className="space-y-2">
          {conversations.map((convo) => {
            const participant = convo.other_participants?.[0]
            const displayName = participant?.display_name || participant?.anon_username || "Unknown"
            const initials = participant?.anon_username 
              ? (participant.anon_username.length > 5 
                  ? participant.anon_username.slice(5, 7).toUpperCase() 
                  : participant.anon_username.slice(0, 2).toUpperCase())
              : "??"

            return (
              <Link
                key={convo.id}
                href={`/messages?conversation=${convo.id}`}
                className="flex items-center gap-3 p-2 -mx-2 rounded-lg hover:bg-muted transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-white text-xs font-medium overflow-hidden shrink-0">
                  {participant?.profile_photo_url ? (
                    <Image
                      src={participant.profile_photo_url}
                      alt={displayName}
                      width={32}
                      height={32}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    initials
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{displayName}</div>
                  <div className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(convo.updated_at), { addSuffix: true })}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-4">
          <p className="text-xs text-muted-foreground mb-2">No messages yet</p>
          <Link href="/messages">
            <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
              <Plus className="h-3 w-3" />
              Start a conversation
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
}

// Compact version for header or other areas
export function MessagesQuickAccess() {
  const { user } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)

  // In a real app, you'd fetch unread message count here
  // For now, this is a placeholder

  if (!user) return null

  return (
    <Link href="/messages">
      <Button variant="ghost" size="icon" className="relative">
        <MessageSquare className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Button>
    </Link>
  )
}






