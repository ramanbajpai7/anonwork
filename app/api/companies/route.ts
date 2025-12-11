import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/neon"

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const search = url.searchParams.get("search") || ""
    const page = Number.parseInt(url.searchParams.get("page") || "1")
    const limit = Number.parseInt(url.searchParams.get("limit") || "20")
    const offset = (page - 1) * limit

    let whereClause = "WHERE verified = true"
    const params: any[] = []
    let paramIndex = 1

    if (search) {
      whereClause += ` AND LOWER(name) LIKE LOWER($${paramIndex})`
      params.push(`%${search}%`)
      paramIndex++
    }

    params.push(limit, offset)

    const companies = await query(
      `SELECT * FROM companies
       ${whereClause}
       ORDER BY name ASC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      params
    )

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) as total FROM companies ${whereClause}`,
      search ? [`%${search}%`] : []
    )
    const total = parseInt(countResult[0]?.total || "0")

    return NextResponse.json({ companies, page, limit, total })
  } catch (error) {
    console.error("Get companies error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, domain } = await request.json()

    if (!name) {
      return NextResponse.json({ message: "Company name required" }, { status: 400 })
    }

    const companies = await query(
      `INSERT INTO companies (name, domain, verified) 
       VALUES ($1, $2, $3) 
       RETURNING *`,
      [name, domain || null, false]
    )

    if (companies.length === 0) {
      return NextResponse.json({ message: "Failed to create company" }, { status: 500 })
    }

    return NextResponse.json({ company: companies[0] }, { status: 201 })
  } catch (error) {
    console.error("Create company error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
