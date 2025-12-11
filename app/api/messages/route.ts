import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/neon"
import { verifyToken } from "@/lib/auth"
import { cookies } from "next/headers"

// Get user's conversations
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth_token")?.value

    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    const userId = decoded.userId

    const conversations = await query(
      `SELECT 
        c.*,
        cp.last_read_at,
        (
          SELECT json_agg(json_build_object(
            'user_id', u.id,
            'anon_username', u.anon_username,
            'profile_photo_url', u.profile_photo_url
          ))
          FROM conversation_participants cp2
          JOIN users u ON u.id = cp2.user_id
          WHERE cp2.conversation_id = c.id AND cp2.user_id != $1
        ) as other_participants
      FROM conversations c
      JOIN conversation_participants cp ON cp.conversation_id = c.id AND cp.user_id = $1
      ORDER BY c.updated_at DESC`,
      [userId]
    )
    
    // Try to get display_name for participants (column may not exist)
    try {
      for (const convo of conversations) {
        if (convo.other_participants) {
          for (const participant of convo.other_participants) {
            const displayNameResult = await query(
              `SELECT display_name FROM users WHERE id = $1`,
              [participant.user_id]
            )
            participant.display_name = displayNameResult[0]?.display_name || null
          }
        }
      }
    } catch {
      // Column doesn't exist yet, ignore
    }

    return NextResponse.json({ conversations })
  } catch (error) {
    console.error("Get conversations error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

// Start new conversation / Send message
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth_token")?.value

    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    const userId = decoded.userId

    const { recipient_id, body } = await request.json()

    if (!recipient_id || !body) {
      return NextResponse.json(
        { message: "Recipient and message body are required" }, 
        { status: 400 }
      )
    }

    // Check if conversation already exists
    const existingConvo = await query(
      `SELECT c.id FROM conversations c
       WHERE c.type = 'dm'
       AND EXISTS (SELECT 1 FROM conversation_participants WHERE conversation_id = c.id AND user_id = $1)
       AND EXISTS (SELECT 1 FROM conversation_participants WHERE conversation_id = c.id AND user_id = $2)`,
      [userId, recipient_id]
    )

    let conversationId

    if (existingConvo.length > 0) {
      conversationId = existingConvo[0].id
    } else {
      // Create new conversation
      const newConvo = await query(
        `INSERT INTO conversations (type, created_by) VALUES ('dm', $1) RETURNING id`,
        [userId]
      )
      conversationId = newConvo[0].id

      // Add participants
      await query(
        `INSERT INTO conversation_participants (conversation_id, user_id) VALUES ($1, $2), ($1, $3)`,
        [conversationId, userId, recipient_id]
      )
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

    return NextResponse.json({ 
      message: messages[0],
      conversation_id: conversationId 
    }, { status: 201 })
  } catch (error) {
    console.error("Send message error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

