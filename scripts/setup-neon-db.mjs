// Script to set up Neon database tables
import { neon } from "@neondatabase/serverless"

const DATABASE_URL = "postgresql://neondb_owner:npg_lFXkQLM67dbC@ep-shy-water-ahu7l2ab.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require"

const sql = neon(DATABASE_URL)

async function setupDatabase() {
  console.log("🚀 Setting up Neon database...")

  try {
    // Create UUID extension
    console.log("Creating UUID extension...")
    await sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`

    // Create users table
    console.log("Creating users table...")
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        email TEXT UNIQUE,
        email_verified BOOLEAN DEFAULT false,
        password_hash TEXT,
        work_email_domain TEXT,
        anon_username TEXT UNIQUE NOT NULL,
        role TEXT DEFAULT 'user',
        is_verified_employee BOOLEAN DEFAULT false,
        profile_meta JSONB DEFAULT '{}',
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now(),
        last_active_at TIMESTAMPTZ DEFAULT now()
      )
    `

    // Create companies table
    console.log("Creating companies table...")
    await sql`
      CREATE TABLE IF NOT EXISTS companies (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name TEXT UNIQUE NOT NULL,
        domain TEXT UNIQUE,
        verified BOOLEAN DEFAULT false,
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
      )
    `

    // Create channels table
    console.log("Creating channels table...")
    await sql`
      CREATE TABLE IF NOT EXISTS channels (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
        description TEXT,
        is_private BOOLEAN DEFAULT false,
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
      )
    `

    // Create posts table
    console.log("Creating posts table...")
    await sql`
      CREATE TABLE IF NOT EXISTS posts (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        channel_id UUID REFERENCES channels(id) ON DELETE SET NULL,
        title TEXT,
        body TEXT NOT NULL,
        is_anonymous BOOLEAN DEFAULT true,
        metadata JSONB DEFAULT '{}',
        score INT DEFAULT 0,
        views INT DEFAULT 0,
        status TEXT DEFAULT 'active',
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
      )
    `

    // Create comments table
    console.log("Creating comments table...")
    await sql`
      CREATE TABLE IF NOT EXISTS comments (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
        author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        body TEXT NOT NULL,
        parent_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
        status TEXT DEFAULT 'active',
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
      )
    `

    // Create post_votes table
    console.log("Creating post_votes table...")
    await sql`
      CREATE TABLE IF NOT EXISTS post_votes (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        vote SMALLINT,
        created_at TIMESTAMPTZ DEFAULT now(),
        UNIQUE(post_id, user_id)
      )
    `

    // Create notifications table
    console.log("Creating notifications table...")
    await sql`
      CREATE TABLE IF NOT EXISTS notifications (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type TEXT NOT NULL,
        payload JSONB DEFAULT '{}',
        read BOOLEAN DEFAULT false,
        created_at TIMESTAMPTZ DEFAULT now()
      )
    `

    // Create reports table
    console.log("Creating reports table...")
    await sql`
      CREATE TABLE IF NOT EXISTS reports (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        reporter_id UUID REFERENCES users(id) ON DELETE SET NULL,
        target_post_id UUID REFERENCES posts(id) ON DELETE SET NULL,
        reason TEXT NOT NULL,
        status TEXT DEFAULT 'open',
        created_at TIMESTAMPTZ DEFAULT now(),
        reviewed_at TIMESTAMPTZ,
        action_taken_by UUID REFERENCES users(id) ON DELETE SET NULL
      )
    `

    console.log("✅ Database setup complete!")
    console.log("\nTables created:")
    console.log("  - users")
    console.log("  - companies")
    console.log("  - channels")
    console.log("  - posts")
    console.log("  - comments")
    console.log("  - post_votes")
    console.log("  - notifications")
    console.log("  - reports")

  } catch (error) {
    console.error("❌ Error setting up database:", error)
    process.exit(1)
  }
}

setupDatabase()

