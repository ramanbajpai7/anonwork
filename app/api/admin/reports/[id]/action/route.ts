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

    // Check if user is admin
    const { data: user } = await supabase.from("users").select("role").eq("id", userId).single()

    if (!user || user.role !== "admin") {
      return NextResponse.json({ message: "Admin only" }, { status: 403 })
    }

    const { action, reason } = await request.json()

    if (!["remove", "approve"].includes(action)) {
      return NextResponse.json({ message: "Invalid action" }, { status: 400 })
    }

    const { data: report, error: fetchError } = await supabase.from("reports").select("*").eq("id", params.id).single()

    if (!report) {
      return NextResponse.json({ message: "Report not found" }, { status: 404 })
    }

    // Update report
    const { error: updateError } = await supabase
      .from("reports")
      .update({
        status: "actioned",
        reviewed_at: new Date().toISOString(),
        action_taken_by: userId,
      })
      .eq("id", params.id)

    if (updateError) {
      return NextResponse.json({ message: "Failed to update report" }, { status: 500 })
    }

    // Take action on post if needed
    if (action === "remove" && report.target_post_id) {
      await supabase
        .from("posts")
        .update({ status: "removed", updated_at: new Date().toISOString() })
        .eq("id", report.target_post_id)
    }

    return NextResponse.json({ message: "Action taken successfully" })
  } catch (error) {
    console.error("Report action error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
