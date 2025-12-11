import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/neon"
import { verifyToken } from "@/lib/auth"
import { cookies } from "next/headers"

// Get messages in a conversation
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const { conversationId } = await params
    const cookieStore = await cookies()
    const token = cookieStore.get("auth_token")?.value

    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    const userId = decoded.userId

    // Verify user is participant
    const participant = await query(
      `SELECT * FROM conversation_participants WHERE conversation_id = $1 AND user_id = $2`,
      [conversationId, userId]
    )

    if (participant.length === 0) {
      return NextResponse.json({ message: "Not authorized" }, { status: 403 })
    }

    // Get messages
    const messages = await query(
      `SELECT 
        dm.*,
        u.anon_username as sender_anon_username,
        u.profile_photo_url as sender_profile_photo
      FROM direct_messages dm
      JOIN users u ON u.id = dm.sender_id
      WHERE dm.conversation_id = $1
      ORDER BY dm.created_at ASC`,
      [conversationId]
    )
    
    // Try to get display_name for senders (column may not exist)
    try {
      for (const msg of messages) {
        const displayNameResult = await query(
          `SELECT display_name FROM users WHERE id = $1`,
          [msg.sender_id]
        )
        msg.sender_display_name = displayNameResult[0]?.display_name || null
      }
    } catch {
      // Column doesn't exist yet, set all to null
      for (const msg of messages) {
        msg.sender_display_name = null
      }
    }

    // Mark as read
    await query(
      `UPDATE conversation_participants SET last_read_at = NOW() WHERE conversation_id = $1 AND user_id = $2`,
      [conversationId, userId]
    )

    return NextResponse.json({ messages })
  } catch (error) {
    console.error("Get messages error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

// Send message to existing conversation
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const { conversationId } = await params
    const cookieStore = await cookies()
    const token = cookieStore.get("auth_token")?.value

    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    const userId = decoded.userId

    // Verify user is participant
    const participant = await query(
      `SELECT * FROM conversation_participants WHERE conversation_id = $1 AND user_id = $2`,
      [conversationId, userId]
    )

    if (participant.length === 0) {
      return NextResponse.json({ message: "Not authorized" }, { status: 403 })
    }

    const { body } = await request.json()

    if (!body) {
      return NextResponse.json({ message: "Message body required" }, { status: 400 })
    }

    // Send message
    const messages = await query(
      `INSERT INTO direct_messages (conversation_id, sender_id, body)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [conversationId, userId, body]
    )

    // Update conversation timestamp
    await query(
      `UPDATE conversations SET updated_at = NOW() WHERE id = $1`,
      [conversationId]
    )

    return NextResponse.json({ message: messages[0] }, { status: 201 })
  } catch (error) {
    console.error("Send message error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

