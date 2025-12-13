"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Header } from "@/components/layout/header"
import { Sidebar } from "@/components/layout/sidebar"
import { MobileNav } from "@/components/layout/mobile-nav"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { MessageSquare, Send, ArrowLeft, Plus, Search, Loader2 } from "lucide-react"
import Image from "next/image"
import { formatDistanceToNow } from "date-fns"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/use-auth"

interface Conversation {
  id: string
  type: string
  last_read_at: string
  other_participants: { 
    user_id: string
    anon_username: string
    display_name?: string | null
    profile_photo_url?: string | null
  }[] | null
  updated_at: string
}

interface Message {
  id: string
  body: string
  sender_id: string
  sender_anon_username: string
  sender_display_name?: string | null
  sender_profile_photo?: string | null
  created_at: string
}

export default function MessagesPage() {
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const conversationParam = searchParams.get("conversation")
  
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConvo, setSelectedConvo] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [sendingMessage, setSendingMessage] = useState(false)

  // New conversation state
  const [showNewConvo, setShowNewConvo] = useState(false)
  const [searchUsername, setSearchUsername] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [selectedRecipient, setSelectedRecipient] = useState<any>(null)
  const [newConvoMessage, setNewConvoMessage] = useState("")
  const [startingConvo, setStartingConvo] = useState(false)

  useEffect(() => {
    fetchConversations()
  }, [])

  // Handle URL parameter for direct conversation access
  useEffect(() => {
    if (conversationParam && !loading) {
      setSelectedConvo(conversationParam)
      fetchMessages(conversationParam)
    }
  }, [conversationParam, loading])

  async function fetchConversations() {
    try {
      const res = await fetch("/api/messages")
      if (res.ok) {
        const data = await res.json()
        setConversations(data.conversations || [])
      }
    } catch (error) {
      console.error("Failed to fetch conversations:", error)
    } finally {
      setLoading(false)
    }
  }

  async function fetchMessages(conversationId: string) {
    try {
      const res = await fetch(`/api/messages/${conversationId}`)
      if (res.ok) {
        const data = await res.json()
        setMessages(data.messages || [])
      }
    } catch (error) {
      console.error("Failed to fetch messages:", error)
    }
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!newMessage.trim() || !selectedConvo || sendingMessage) return

    setSendingMessage(true)
    try {
      const res = await fetch(`/api/messages/${selectedConvo}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: newMessage }),
      })
      if (res.ok) {
        const data = await res.json()
        setMessages([...messages, { ...data.message, sender_anon_username: user?.anon_username }])
        setNewMessage("")
      }
    } catch (error) {
      console.error("Failed to send message:", error)
    } finally {
      setSendingMessage(false)
    }
  }

  async function searchUsers() {
    if (!searchUsername.trim()) return
    setSearchLoading(true)
    try {
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(searchUsername)}`)
      if (res.ok) {
        const data = await res.json()
        setSearchResults(data.users || [])
      }
    } catch (error) {
      console.error("Failed to search users:", error)
    } finally {
      setSearchLoading(false)
    }
  }

  async function startNewConversation() {
    if (!selectedRecipient || !newConvoMessage.trim()) return
    setStartingConvo(true)
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          recipient_id: selectedRecipient.id, 
          body: newConvoMessage 
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setShowNewConvo(false)
        setSearchUsername("")
        setSearchResults([])
        setSelectedRecipient(null)
        setNewConvoMessage("")
        await fetchConversations()
        setSelectedConvo(data.conversation_id)
        fetchMessages(data.conversation_id)
      }
    } catch (error) {
      console.error("Failed to start conversation:", error)
    } finally {
      setStartingConvo(false)
    }
  }

  function handleSelectConvo(convoId: string) {
    setSelectedConvo(convoId)
    fetchMessages(convoId)
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 pb-20 lg:pb-0">
          <div className="h-[calc(100vh-64px)] flex">
            {/* Conversations List */}
            <div className={cn(
              "w-full sm:w-80 border-r border-border flex-shrink-0 flex flex-col",
              selectedConvo && "hidden sm:flex"
            )}>
              <div className="p-4 border-b border-border flex justify-between items-center">
                <h2 className="font-semibold text-lg">Messages</h2>
                <Dialog open={showNewConvo} onOpenChange={setShowNewConvo}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="gap-1">
                      <Plus className="h-4 w-4" />
                      New
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>New Conversation</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                      {!selectedRecipient ? (
                        <>
                          <div>
                            <Label>Find User</Label>
                            <div className="flex gap-2 mt-1">
                              <Input
                                placeholder="Search by username..."
                                value={searchUsername}
                                onChange={(e) => setSearchUsername(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && searchUsers()}
                              />
                              <Button onClick={searchUsers} disabled={searchLoading}>
                                {searchLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                              </Button>
                            </div>
                          </div>
                          {searchResults.length > 0 && (
                            <div className="space-y-2">
                              <Label>Select User</Label>
                              {searchResults.map((u) => (
                                <button
                                  key={u.id}
                                  onClick={() => setSelectedRecipient(u)}
                                  className="w-full p-3 text-left bg-muted rounded-lg hover:bg-muted/80 transition-colors"
                                >
                                  <div className="font-medium">{u.anon_username}</div>
                                  {u.is_verified_employee && (
                                    <span className="text-xs text-green-600">✓ Verified Employee</span>
                                  )}
                                </button>
                              ))}
                            </div>
                          )}
                          {searchResults.length === 0 && searchUsername && !searchLoading && (
                            <p className="text-sm text-muted-foreground">No users found</p>
                          )}
                        </>
                      ) : (
                        <>
                          <div className="bg-muted p-3 rounded-lg flex justify-between items-center">
                            <div>
                              <div className="text-sm text-muted-foreground">Sending to:</div>
                              <div className="font-medium">{selectedRecipient.anon_username}</div>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => setSelectedRecipient(null)}>
                              Change
                            </Button>
                          </div>
                          <div>
                            <Label>Message</Label>
                            <Input
                              placeholder="Type your message..."
                              value={newConvoMessage}
                              onChange={(e) => setNewConvoMessage(e.target.value)}
                              className="mt-1"
                            />
                          </div>
                          <Button 
                            onClick={startNewConversation} 
                            className="w-full"
                            disabled={!newConvoMessage.trim() || startingConvo}
                          >
                            {startingConvo ? (
                              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Sending...</>
                            ) : (
                              <><Send className="h-4 w-4 mr-2" /> Send Message</>
                            )}
                          </Button>
                        </>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              <div className="overflow-y-auto flex-1">
                {loading ? (
                  <div className="p-4 text-center text-muted-foreground">Loading...</div>
                ) : conversations.length > 0 ? (
                  conversations.map((convo) => {
                    const participant = convo.other_participants?.[0]
                    const displayName = participant?.display_name || participant?.anon_username || "Unknown User"
                    return (
                      <button
                        key={convo.id}
                        onClick={() => handleSelectConvo(convo.id)}
                        className={cn(
                          "w-full p-4 text-left border-b border-border hover:bg-muted transition-colors",
                          selectedConvo === convo.id && "bg-muted"
                        )}
                      >
                        <div className="flex gap-3 items-center">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-sm font-medium overflow-hidden shrink-0">
                            {participant?.profile_photo_url ? (
                              <Image
                                src={participant.profile_photo_url}
                                alt={displayName}
                                width={40}
                                height={40}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              (participant?.anon_username || "??").slice(5, 7).toUpperCase()
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                              <span className="font-medium truncate">{displayName}</span>
                              <span className="text-xs text-muted-foreground shrink-0">
                                {formatDistanceToNow(new Date(convo.updated_at), { addSuffix: true })}
                              </span>
                            </div>
                            {participant?.display_name && (
                              <span className="text-xs text-muted-foreground">@{participant.anon_username}</span>
                            )}
                          </div>
                        </div>
                      </button>
                    )
                  })
                ) : (
                  <div className="p-6 text-center text-muted-foreground">
                    <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p className="font-medium">No conversations yet</p>
                    <p className="text-sm mt-1">Start a new conversation!</p>
                    <Button 
                      className="mt-4 gap-2" 
                      onClick={() => setShowNewConvo(true)}
                    >
                      <Plus className="h-4 w-4" />
                      New Message
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Messages Area */}
            <div className={cn(
              "flex-1 flex flex-col",
              !selectedConvo && "hidden sm:flex"
            )}>
              {selectedConvo ? (
                <>
                  <div className="p-4 border-b border-border flex items-center gap-3">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="sm:hidden"
                      onClick={() => setSelectedConvo(null)}
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </Button>
                    {(() => {
                      const participant = conversations.find(c => c.id === selectedConvo)?.other_participants?.[0]
                      const displayName = participant?.display_name || participant?.anon_username || "Conversation"
                      return (
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-xs font-medium overflow-hidden">
                            {participant?.profile_photo_url ? (
                              <Image
                                src={participant.profile_photo_url}
                                alt={displayName}
                                width={32}
                                height={32}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              (participant?.anon_username || "??").slice(5, 7).toUpperCase()
                            )}
                          </div>
                          <div>
                            <span className="font-semibold">{displayName}</span>
                            {participant?.display_name && (
                              <span className="text-xs text-muted-foreground ml-2">@{participant.anon_username}</span>
                            )}
                          </div>
                        </div>
                      )
                    })()}
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.length === 0 ? (
                      <div className="text-center text-muted-foreground py-8">
                        <p>No messages yet. Start the conversation!</p>
                      </div>
                    ) : (
                      messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={cn(
                            "max-w-[80%] p-3 rounded-lg",
                            msg.sender_id === user?.id
                              ? "ml-auto bg-primary text-primary-foreground"
                              : "bg-muted"
                          )}
                        >
                          <p>{msg.body}</p>
                          <p className={cn(
                            "text-xs mt-1",
                            msg.sender_id === user?.id ? "text-primary-foreground/70" : "text-muted-foreground"
                          )}>
                            {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                          </p>
                        </div>
                      ))
                    )}
                  </div>

                  <form onSubmit={sendMessage} className="p-4 border-t border-border flex gap-2">
                    <Input
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      className="flex-1"
                      disabled={sendingMessage}
                    />
                    <Button type="submit" size="icon" disabled={sendingMessage || !newMessage.trim()}>
                      {sendingMessage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </Button>
                  </form>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">Select a conversation</p>
                    <p className="text-sm mt-1">Or start a new one</p>
                  </div>
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
