import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/neon"

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const q = url.searchParams.get("q")
    const type = url.searchParams.get("type") || "all" // all, posts, companies, users
    const limit = Number.parseInt(url.searchParams.get("limit") || "20")

    if (!q || q.length < 2) {
      return NextResponse.json({ message: "Search query too short" }, { status: 400 })
    }

    const searchTerm = `%${q}%`
    const results: any = {}

    if (type === "all" || type === "posts") {
      const posts = await query(
        `SELECT 
          p.id, p.title, p.body, p.score, p.created_at,
          u.anon_username as author_anon_username,
          t.name as topic_name, t.slug as topic_slug
        FROM posts p
        LEFT JOIN users u ON p.author_id = u.id
        LEFT JOIN topics t ON p.topic_id = t.id
        WHERE p.status = 'active' 
          AND (LOWER(p.title) LIKE LOWER($1) OR LOWER(p.body) LIKE LOWER($1))
        ORDER BY p.score DESC, p.created_at DESC
        LIMIT $2`,
        [searchTerm, limit]
      )
      results.posts = posts
    }

    if (type === "all" || type === "companies") {
      const companies = await query(
        `SELECT id, name, domain, verified
        FROM companies
        WHERE LOWER(name) LIKE LOWER($1) OR LOWER(domain) LIKE LOWER($1)
        ORDER BY verified DESC, name ASC
        LIMIT $2`,
        [searchTerm, limit]
      )
      results.companies = companies
    }

    if (type === "all" || type === "users") {
      const users = await query(
        `SELECT id, anon_username, is_verified_employee
        FROM users
        WHERE LOWER(anon_username) LIKE LOWER($1)
        ORDER BY is_verified_employee DESC
        LIMIT $2`,
        [searchTerm, limit]
      )
      results.users = users
    }

    if (type === "all" || type === "topics") {
      const topics = await query(
        `SELECT id, name, slug, description, icon, post_count
        FROM topics
        WHERE is_active = true 
          AND (LOWER(name) LIKE LOWER($1) OR LOWER(description) LIKE LOWER($1))
        ORDER BY post_count DESC
        LIMIT $2`,
        [searchTerm, limit]
      )
      results.topics = topics
    }

    return NextResponse.json({ results, query: q })
  } catch (error) {
    console.error("Search error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
