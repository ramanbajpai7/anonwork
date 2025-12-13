import { query } from "@/lib/neon"

export type NotificationType = 
  | "comment" 
  | "reply" 
  | "upvote" 
  | "milestone" 
  | "mention"
  | "message"

interface NotificationData {
  postId?: string
  postTitle?: string
  commentId?: string
  userId?: string
  username?: string
  [key: string]: any
}

// Create a notification
export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  body?: string,
  data?: NotificationData
) {
  try {
    // Ensure table exists
    await query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        body TEXT,
        data JSONB DEFAULT '{}',
        read BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `)

    await query(
      `INSERT INTO notifications (user_id, type, title, body, data)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, type, title, body || null, JSON.stringify(data || {})]
    )
  } catch (error) {
    console.error("Failed to create notification:", error)
    // Don't throw - notifications should fail silently
  }
}

// Notify post author about a new comment
export async function notifyComment(
  postAuthorId: string,
  commenterId: string,
  commenterUsername: string,
  postId: string,
  postTitle: string,
  commentPreview: string
) {
  // Don't notify if user is commenting on their own post
  if (postAuthorId === commenterId) return

  await createNotification(
    postAuthorId,
    "comment",
    `${commenterUsername} commented on your post`,
    commentPreview.slice(0, 100) + (commentPreview.length > 100 ? "..." : ""),
    { postId, postTitle, userId: commenterId, username: commenterUsername }
  )
}

// Notify comment author about a reply
export async function notifyReply(
  parentCommentAuthorId: string,
  replierId: string,
  replierUsername: string,
  postId: string,
  postTitle: string,
  replyPreview: string
) {
  // Don't notify if user is replying to themselves
  if (parentCommentAuthorId === replierId) return

  await createNotification(
    parentCommentAuthorId,
    "reply",
    `${replierUsername} replied to your comment`,
    replyPreview.slice(0, 100) + (replyPreview.length > 100 ? "..." : ""),
    { postId, postTitle, userId: replierId, username: replierUsername }
  )
}

// Notify about upvote (batched - only notify at milestones)
export async function notifyUpvoteMilestone(
  postAuthorId: string,
  postId: string,
  postTitle: string,
  newScore: number
) {
  // Only notify at certain milestones
  const milestones = [5, 10, 25, 50, 100, 250, 500, 1000]
  
  if (milestones.includes(newScore)) {
    await createNotification(
      postAuthorId,
      "milestone",
      `Your post reached ${newScore} upvotes! 🎉`,
      postTitle.slice(0, 100) + (postTitle.length > 100 ? "..." : ""),
      { postId, postTitle, score: newScore }
    )
  }
}

// Notify about individual upvote (for low-score posts)
export async function notifyUpvote(
  postAuthorId: string,
  voterId: string,
  voterUsername: string,
  postId: string,
  postTitle: string,
  newScore: number
) {
  // Don't notify if user is voting on their own post
  if (postAuthorId === voterId) return
  
  // Only notify for the first few upvotes
  if (newScore <= 3) {
    await createNotification(
      postAuthorId,
      "upvote",
      `${voterUsername} upvoted your post`,
      postTitle.slice(0, 100) + (postTitle.length > 100 ? "..." : ""),
      { postId, postTitle, userId: voterId, username: voterUsername }
    )
  }
  
  // Also check for milestones
  await notifyUpvoteMilestone(postAuthorId, postId, postTitle, newScore)
}

// Parse mentions from text and notify mentioned users
export async function notifyMentions(
  text: string,
  authorId: string,
  authorUsername: string,
  postId: string,
  postTitle: string,
  contextType: "post" | "comment"
) {
  // Find @mentions in text (matches @username patterns like @user_abc1, @anon_xyz)
  const mentionRegex = /@([a-zA-Z][a-zA-Z0-9_]{2,})/g
  const matches = text.matchAll(mentionRegex)
  const mentionedUsernames = new Set<string>()

  for (const match of matches) {
    mentionedUsernames.add(match[1])
  }

  if (mentionedUsernames.size === 0) return

  // Look up mentioned users
  for (const username of mentionedUsernames) {
    try {
      const users = await query(
        "SELECT id FROM users WHERE anon_username = $1",
        [username]
      )

      if (users.length > 0 && users[0].id !== authorId) {
        await createNotification(
          users[0].id,
          "mention",
          `${authorUsername} mentioned you in a ${contextType}`,
          text.slice(0, 100) + (text.length > 100 ? "..." : ""),
          { postId, postTitle, userId: authorId, username: authorUsername }
        )
      }
    } catch (error) {
      console.error(`Failed to notify mention for ${username}:`, error)
    }
  }
}


