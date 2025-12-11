import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { verifyToken } from "@/lib/auth"
import { cookies } from "next/headers"

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth_token")?.value

    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    const userId = decoded.userId

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    // Check authorization
    const { data: notification } = await supabase.from("notifications").select("user_id").eq("id", params.id).single()

    if (!notification || notification.user_id !== userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 })
    }

    const { data: updated, error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", params.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ message: "Failed to mark as read" }, { status: 500 })
    }

    return NextResponse.json({ notification: updated })
  } catch (error) {
    console.error("Mark as read error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
