// Database connection helper for Supabase/Neon

import { createClient } from "@supabase/supabase-js"

let supabaseClient: ReturnType<typeof createClient> | null = null

export function getSupabaseClient() {
  if (!supabaseClient) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Missing Supabase environment variables")
    }

    supabaseClient = createClient(supabaseUrl, supabaseAnonKey)
  }

  return supabaseClient
}

export async function query(sql: string, values?: any[]) {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error("DATABASE_URL not set")

  const response = await fetch(`${url}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: sql, values }),
  })

  if (!response.ok) {
    throw new Error(`Database query failed: ${response.statusText}`)
  }

  return response.json()
}
