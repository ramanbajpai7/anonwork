import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { verifyToken } from "@/lib/auth"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const type = url.searchParams.get("type")
    const company_id = url.searchParams.get("company_id")
    const page = Number.parseInt(url.searchParams.get("page") || "1")
    const limit = Number.parseInt(url.searchParams.get("limit") || "20")
    const offset = (page - 1) * limit

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    let query = supabase.from("channels").select("*", { count: "exact" })

    if (type) {
      query = query.eq("type", type)
    }

    if (company_id) {
      query = query.eq("company_id", company_id)
    }

    const { data: channels, count, error } = await query.order("name").range(offset, offset + limit - 1)

    if (error) {
      return NextResponse.json({ message: "Failed to fetch channels" }, { status: 500 })
    }

    return NextResponse.json({ channels, page, limit, total: count || 0 })
  } catch (error) {
    console.error("Get channels error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth_token")?.value

    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    const userId = decoded.userId

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    // Check if user is admin
    const { data: user } = await supabase.from("users").select("role").eq("id", userId).single()

    if (!user || user.role !== "admin") {
      return NextResponse.json({ message: "Admin only" }, { status: 403 })
    }

    const { name, type, company_id, description, is_private } = await request.json()

    if (!name || !type) {
      return NextResponse.json({ message: "Name and type required" }, { status: 400 })
    }

    const { data: channel, error } = await supabase
      .from("channels")
      .insert({
        name,
        type,
        company_id: company_id || null,
        description: description || null,
        is_private: is_private || false,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ message: "Failed to create channel" }, { status: 500 })
    }

    return NextResponse.json({ channel }, { status: 201 })
  } catch (error) {
    console.error("Create channel error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
