import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { verifyToken } from "@/lib/auth"
import { cookies } from "next/headers"

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
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
    const { data: comment } = await supabase.from("comments").select("author_id, post_id").eq("id", params.id).single()

    if (!comment || comment.author_id !== userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 })
    }

    // Soft delete
    const { error } = await supabase
      .from("comments")
      .update({ status: "removed", updated_at: new Date().toISOString() })
      .eq("id", params.id)

    if (error) {
      return NextResponse.json({ message: "Failed to delete comment" }, { status: 500 })
    }

    return NextResponse.json({ message: "Comment deleted" })
  } catch (error) {
    console.error("Delete comment error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
