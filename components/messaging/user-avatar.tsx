"use client"

import { useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Loader2, MessageCircle, Send, User } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/use-auth"

interface UserAvatarProps {
  userId?: string
  username: string
  displayName?: string | null
  photoUrl?: string | null
  isVerified?: boolean
  size?: "sm" | "md" | "lg"
  showMessageOnClick?: boolean
  className?: string
}

export function UserAvatar({
  userId,
  username,
  displayName,
  photoUrl,
  isVerified,
  size = "md",
  showMessageOnClick = true,
  className,
}: UserAvatarProps) {
  const { user } = useAuth()
  const router = useRouter()
  const [showMessageDialog, setShowMessageDialog] = useState(false)
  const [message, setMessage] = useState("")
  const [sending, setSending] = useState(false)

  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base",
  }

  const initials = username.length > 5 
    ? username.slice(5, 7).toUpperCase() 
    : username.slice(0, 2).toUpperCase()

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    // Don't show message dialog for own profile or if not logged in
    if (!user || !userId || userId === user.id || !showMessageOnClick) {
      return
    }
    
    setShowMessageDialog(true)
  }

  const handleSendMessage = async () => {
    if (!message.trim() || !userId || sending) return

    setSending(true)
    try {
      // First try to find or create a conversation
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipient_id: userId,
          body: message,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setShowMessageDialog(false)
        setMessage("")
        // Navigate to the conversation
        router.push(`/messages?conversation=${data.conversation_id}`)
      }
    } catch (error) {
      console.error("Failed to send message:", error)
    } finally {
      setSending(false)
    }
  }

  const isClickable = showMessageOnClick && user && userId && userId !== user.id

  return (
    <>
      <button
        onClick={handleClick}
        disabled={!isClickable}
        className={cn(
          "rounded-full bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-white font-medium overflow-hidden transition-all shrink-0",
          sizeClasses[size],
          isClickable && "cursor-pointer hover:ring-2 hover:ring-primary hover:ring-offset-2 hover:scale-105",
          !isClickable && "cursor-default",
          className
        )}
        title={isClickable ? `Message ${displayName || username}` : undefined}
      >
        {photoUrl ? (
          <Image
            src={photoUrl}
            alt={displayName || username}
            width={48}
            height={48}
            className="w-full h-full object-cover"
          />
        ) : (
          initials
        )}
      </button>

      <Dialog open={showMessageDialog} onOpenChange={setShowMessageDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className={cn(
                "rounded-full bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-white font-medium overflow-hidden shrink-0",
                sizeClasses.md
              )}>
                {photoUrl ? (
                  <Image
                    src={photoUrl}
                    alt={displayName || username}
                    width={40}
                    height={40}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  initials
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span>Message {displayName || username}</span>
                  {isVerified && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">✓ Verified</span>
                  )}
                </div>
                {displayName && (
                  <span className="text-xs text-muted-foreground font-normal">@{username}</span>
                )}
              </div>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div className="relative">
              <Input
                placeholder="Type your message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                className="pr-12"
                disabled={sending}
                autoFocus
              />
              <Button
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                onClick={handleSendMessage}
                disabled={!message.trim() || sending}
              >
                {sending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Press Enter to send or click the send button
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

// Quick message button component
interface QuickMessageButtonProps {
  userId: string
  username: string
  displayName?: string | null
  photoUrl?: string | null
  isVerified?: boolean
  variant?: "default" | "ghost" | "outline"
  size?: "sm" | "default" | "icon"
  className?: string
}

export function QuickMessageButton({
  userId,
  username,
  displayName,
  photoUrl,
  isVerified,
  variant = "ghost",
  size = "sm",
  className,
}: QuickMessageButtonProps) {
  const { user } = useAuth()
  const router = useRouter()
  const [showMessageDialog, setShowMessageDialog] = useState(false)
  const [message, setMessage] = useState("")
  const [sending, setSending] = useState(false)

  // Don't show for own profile or if not logged in
  if (!user || userId === user.id) {
    return null
  }

  const handleSendMessage = async () => {
    if (!message.trim() || sending) return

    setSending(true)
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipient_id: userId,
          body: message,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setShowMessageDialog(false)
        setMessage("")
        router.push(`/messages?conversation=${data.conversation_id}`)
      }
    } catch (error) {
      console.error("Failed to send message:", error)
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setShowMessageDialog(true)
        }}
        className={cn("text-muted-foreground hover:text-primary", className)}
      >
        <MessageCircle className="w-4 h-4 mr-1" />
        Message
      </Button>

      <Dialog open={showMessageDialog} onOpenChange={setShowMessageDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-white text-sm font-medium overflow-hidden shrink-0">
                {photoUrl ? (
                  <Image
                    src={photoUrl}
                    alt={displayName || username}
                    width={40}
                    height={40}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  username.length > 5 ? username.slice(5, 7).toUpperCase() : username.slice(0, 2).toUpperCase()
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span>Message {displayName || username}</span>
                  {isVerified && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">✓ Verified</span>
                  )}
                </div>
                {displayName && (
                  <span className="text-xs text-muted-foreground font-normal">@{username}</span>
                )}
              </div>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div className="relative">
              <Input
                placeholder="Type your message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                className="pr-12"
                disabled={sending}
                autoFocus
              />
              <Button
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                onClick={handleSendMessage}
                disabled={!message.trim() || sending}
              >
                {sending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Press Enter to send or click the send button
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}






