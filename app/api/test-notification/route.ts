import { NextResponse } from "next/server"
import { query } from "@/lib/neon"
import { verifyToken } from "@/lib/auth"
import { cookies } from "next/headers"

export async function POST() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth_token")?.value

    if (!token) {
      return NextResponse.json({ message: "Unauthorized - please login first" }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    const userId = decoded.userId

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

    // Create test notification
    await query(
      `INSERT INTO notifications (user_id, type, title, body, data)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, "milestone", "🎉 Test Notification!", "This is a test notification to verify the system works.", JSON.stringify({ test: true })]
    )

    return NextResponse.json({ 
      success: true, 
      message: "Test notification created! Check your notifications." 
    })
  } catch (error) {
    console.error("Test notification error:", error)
    return NextResponse.json({ 
      success: false, 
      message: "Failed to create notification", 
      error: String(error) 
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: "POST to this endpoint (while logged in) to create a test notification" 
  })
}





