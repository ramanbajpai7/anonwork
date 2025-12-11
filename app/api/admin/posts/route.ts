import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { verifyToken } from "@/lib/auth"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
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

    const url = new URL(request.url)
    const status = url.searchParams.get("status")
    const page = Number.parseInt(url.searchParams.get("page") || "1")
    const limit = Number.parseInt(url.searchParams.get("limit") || "20")
    const offset = (page - 1) * limit

    let query = supabase.from("posts").select(
      `
        *,
        author:author_id(id, anon_username, email)
      `,
      { count: "exact" },
    )

    if (status) {
      query = query.eq("status", status)
    }

    const {
      data: posts,
      count,
      error,
    } = await query.order("created_at", { ascending: false }).range(offset, offset + limit - 1)

    if (error) {
      return NextResponse.json({ message: "Failed to fetch posts" }, { status: 500 })
    }

    return NextResponse.json({ posts, page, limit, total: count || 0 })
  } catch (error) {
    console.error("Get admin posts error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
