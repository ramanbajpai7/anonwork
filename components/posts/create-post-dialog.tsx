"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Loader2, Plus, ImageIcon, BarChart3 } from "lucide-react"

interface CreatePostDialogProps {
  topicId?: string
  topicName?: string
  channelId?: string
  onPostCreated?: (post: any) => void
  trigger?: React.ReactNode
}

export function CreatePostDialog({ 
  topicId, 
  topicName, 
  channelId, 
  onPostCreated,
  trigger 
}: CreatePostDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  
  // Form state
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const [isAnonymous, setIsAnonymous] = useState(true)
  
  // Poll state
  const [showPoll, setShowPoll] = useState(false)
  const [pollQuestion, setPollQuestion] = useState("")
  const [pollOptions, setPollOptions] = useState(["", ""])

  const resetForm = () => {
    setTitle("")
    setBody("")
    setIsAnonymous(true)
    setShowPoll(false)
    setPollQuestion("")
    setPollOptions(["", ""])
    setError("")
  }

  const addPollOption = () => {
    if (pollOptions.length < 6) {
      setPollOptions([...pollOptions, ""])
    }
  }

  const removePollOption = (index: number) => {
    if (pollOptions.length > 2) {
      setPollOptions(pollOptions.filter((_, i) => i !== index))
    }
  }

  const updatePollOption = (index: number, value: string) => {
    const newOptions = [...pollOptions]
    newOptions[index] = value
    setPollOptions(newOptions)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!body.trim()) {
      setError("Post content is required")
      return
    }

    setLoading(true)
    setError("")

    try {
      const postData: any = {
        title: title.trim() || null,
        body: body.trim(),
        is_anonymous: isAnonymous,
        topic_id: topicId || null,
        channel_id: channelId || null,
      }

      // Add poll if enabled
      if (showPoll && pollQuestion.trim()) {
        const validOptions = pollOptions.filter(opt => opt.trim())
        if (validOptions.length >= 2) {
          postData.poll = {
            question: pollQuestion.trim(),
            options: validOptions.map((opt, idx) => ({ id: `opt_${idx}`, label: opt.trim() })),
            allow_multiple: false,
          }
        }
      }

      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(postData),
      })

      const data = await res.json()

      if (res.ok) {
        resetForm()
        setOpen(false)
        if (onPostCreated) {
          onPostCreated(data.post)
        }
      } else {
        setError(data.message || "Failed to create post")
      }
    } catch (err) {
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen)
      if (!isOpen) resetForm()
    }}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Create Post
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Create a Post
            {topicName && <span className="text-muted-foreground font-normal"> in {topicName}</span>}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Title (optional) */}
          <div>
            <Label htmlFor="title">Title (optional)</Label>
            <Input
              id="title"
              placeholder="Give your post a title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1"
            />
          </div>

          {/* Body */}
          <div>
            <Label htmlFor="body">What's on your mind?</Label>
            <Textarea
              id="body"
              placeholder="Share your thoughts, questions, or experiences..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={5}
              className="mt-1 resize-none"
            />
          </div>

          {/* Poll Section */}
          {showPoll && (
            <div className="space-y-3 p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-between">
                <Label>Poll</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPoll(false)}
                >
                  Remove Poll
                </Button>
              </div>
              <Input
                placeholder="Ask a question..."
                value={pollQuestion}
                onChange={(e) => setPollQuestion(e.target.value)}
              />
              <div className="space-y-2">
                {pollOptions.map((option, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder={`Option ${index + 1}`}
                      value={option}
                      onChange={(e) => updatePollOption(index, e.target.value)}
                    />
                    {pollOptions.length > 2 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removePollOption(index)}
                      >
                        ✕
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              {pollOptions.length < 6 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addPollOption}
                >
                  + Add Option
                </Button>
              )}
            </div>
          )}

          {/* Options Row */}
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <div className="flex items-center gap-2">
              {!showPoll && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPoll(true)}
                  className="gap-1"
                >
                  <BarChart3 className="h-4 w-4" />
                  Add Poll
                </Button>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <Label htmlFor="anonymous" className="text-sm cursor-pointer">
                Post anonymously
              </Label>
              <Switch
                id="anonymous"
                checked={isAnonymous}
                onCheckedChange={setIsAnonymous}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !body.trim()}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Posting...
                </>
              ) : (
                "Post"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

