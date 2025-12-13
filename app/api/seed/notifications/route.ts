import { NextResponse } from "next/server"
import { query } from "@/lib/neon"

export async function POST() {
  try {
    // Ensure notifications table exists
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

    // Get all users
    const users = await query(`SELECT id, anon_username FROM users LIMIT 10`)

    if (users.length === 0) {
      return NextResponse.json({ 
        success: false, 
        message: "No users found in database" 
      }, { status: 404 })
    }

    let insertedCount = 0

    // Insert sample notifications for each user
    for (const user of users) {
      const sampleNotifications = [
        {
          type: "comment",
          title: "Someone commented on your post",
          body: "Great insights! I totally agree with your perspective on this topic.",
          data: { postId: "sample-1", postTitle: "Sample Post" }
        },
        {
          type: "upvote",
          title: "Your post is getting attention! 👍",
          body: "3 people have upvoted your post",
          data: { postId: "sample-2", postTitle: "Another Post" }
        },
        {
          type: "milestone",
          title: "Your post reached 10 upvotes! 🎉",
          body: "Congratulations! Your post is trending.",
          data: { postId: "sample-3", score: 10 }
        },
        {
          type: "mention",
          title: "You were mentioned in a comment",
          body: `@${user.anon_username} what do you think about this?`,
          data: { postId: "sample-4" }
        },
        {
          type: "reply",
          title: "Someone replied to your comment",
          body: "Thanks for sharing your experience!",
          data: { postId: "sample-5" }
        }
      ]

      for (const notif of sampleNotifications) {
        try {
          const hoursAgo = Math.floor(Math.random() * 24)
          await query(
            `INSERT INTO notifications (user_id, type, title, body, data, created_at)
             VALUES ($1, $2, $3, $4, $5, NOW() - ($6 || ' hours')::INTERVAL)`,
            [user.id, notif.type, notif.title, notif.body, JSON.stringify(notif.data), hoursAgo.toString()]
          )
          insertedCount++
        } catch (err) {
          console.error(`Failed to insert notification for ${user.anon_username}:`, err)
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Successfully inserted ${insertedCount} notifications for ${users.length} users`,
      users: users.map(u => u.anon_username)
    })
  } catch (error) {
    console.error("Seed notifications error:", error)
    return NextResponse.json({ 
      success: false, 
      message: "Failed to seed notifications", 
      error: String(error) 
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: "POST to this endpoint to seed sample notifications for all users" 
  })
}

