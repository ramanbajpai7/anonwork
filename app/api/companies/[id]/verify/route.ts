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

    const { proof_email } = await request.json()

    if (!proof_email) {
      return NextResponse.json({ message: "Proof email required" }, { status: 400 })
    }

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    // Check if company exists
    const { data: company } = await supabase.from("companies").select("*").eq("id", params.id).single()

    if (!company) {
      return NextResponse.json({ message: "Company not found" }, { status: 404 })
    }

    // Extract domain from proof email
    const emailDomain = proof_email.split("@")[1]

    // Check if email domain matches company domain
    if (!company.domain || emailDomain !== company.domain) {
      return NextResponse.json(
        { message: `Email domain must match company domain (${company.domain})` },
        { status: 400 },
      )
    }

    // Check for existing verification request
    const { data: existingVerification } = await supabase
      .from("user_company_verifications")
      .select("*")
      .eq("user_id", userId)
      .eq("company_id", params.id)
      .single()

    if (existingVerification) {
      if (existingVerification.status === "approved") {
        return NextResponse.json({ message: "Already verified" }, { status: 400 })
      }
      if (existingVerification.status === "pending") {
        return NextResponse.json({ message: "Verification request already pending" }, { status: 400 })
      }
    }

    // Create verification request
    const { data: verification, error } = await supabase
      .from("user_company_verifications")
      .insert({
        user_id: userId,
        company_id: params.id,
        proof_email,
        status: "pending",
      })
      .select()
      .single()

    if (error) {
      console.error("Verification error:", error)
      return NextResponse.json({ message: "Failed to create verification request" }, { status: 500 })
    }

    // TODO: Send verification email to proof_email
    // For now, auto-approve for demo purposes
    const { data: approved } = await supabase
      .from("user_company_verifications")
      .update({ status: "approved", approved_at: new Date().toISOString() })
      .eq("id", verification.id)
      .select()
      .single()

    // Update user as verified employee
    await supabase
      .from("users")
      .update({
        is_verified_employee: true,
        work_email_domain: company.domain,
      })
      .eq("id", userId)

    return NextResponse.json({ verification: approved }, { status: 201 })
  } catch (error) {
    console.error("Verify company error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
