import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { verifyToken } from "@/lib/auth"
import { cookies } from "next/headers"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth_token")?.value

    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    const userId = decoded.userId

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    // Check if user is admin or moderator
    const { data: user } = await supabase.from("users").select("role").eq("id", userId).single()

    if (!user || !["admin", "moderator"].includes(user.role)) {
      return NextResponse.json({ message: "Admin/moderator only" }, { status: 403 })
    }

    const { action, reason } = await request.json()

    if (!["remove", "hide"].includes(action)) {
      return NextResponse.json({ message: "Invalid action" }, { status: 400 })
    }

    const newStatus = action === "remove" ? "removed" : "hidden"

    const { error } = await supabase
      .from("posts")
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", params.id)

    if (error) {
      return NextResponse.json({ message: "Failed to update post" }, { status: 500 })
    }

    return NextResponse.json({ message: `Post ${action}d successfully` })
  } catch (error) {
    console.error("Post action error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
