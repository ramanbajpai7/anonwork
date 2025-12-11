import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Test connection by checking if users table exists
    const { data, error } = await supabase.from("users").select("id").limit(1)
    
    if (error) {
      // Table doesn't exist - need to create it
      return NextResponse.json({
        success: false,
        message: "Database tables not set up. Please run the SQL schema in Supabase SQL Editor.",
        error: error.message,
        instructions: [
          "1. Go to https://supabase.com/dashboard",
          "2. Select your project",
          "3. Click 'SQL Editor' in the left sidebar",
          "4. Run the schema SQL to create tables"
        ]
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Database connection working! Tables exist.",
      userCount: data?.length || 0
    })

  } catch (error) {
    console.error("Setup error:", error)
    return NextResponse.json({
      success: false,
      message: "Failed to connect to database",
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

