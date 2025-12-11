-- AnonWork Platform - Full Schema Extension
-- Run this in Neon SQL Editor to add all new tables

-- ============================================
-- TOPIC CHANNELS (Public discussion forums)
-- ============================================
CREATE TABLE IF NOT EXISTS topics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  icon TEXT DEFAULT '💬',
  color TEXT DEFAULT '#6366f1',
  post_count INT DEFAULT 0,
  follower_count INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default topics
INSERT INTO topics (name, slug, description, icon, color) VALUES
  ('Tech', 'tech', 'Technology discussions, coding, and engineering', '💻', '#3b82f6'),
  ('Careers', 'careers', 'Career advice, job hunting, and professional growth', '📈', '#10b981'),
  ('Salaries', 'salaries', 'Compensation discussions and salary transparency', '💰', '#f59e0b'),
  ('Interviews', 'interviews', 'Interview prep, experiences, and tips', '🎯', '#8b5cf6'),
  ('Layoffs', 'layoffs', 'Layoff news, support, and job search after layoffs', '📉', '#ef4444'),
  ('Startups', 'startups', 'Startup life, founding, and early-stage companies', '🚀', '#ec4899'),
  ('Remote Work', 'remote-work', 'Working from home, digital nomad, and remote culture', '🏠', '#06b6d4'),
  ('Leadership', 'leadership', 'Management, leadership skills, and team building', '👔', '#6366f1'),
  ('Work-Life Balance', 'work-life-balance', 'Mental health, burnout, and life outside work', '⚖️', '#84cc16'),
  ('Immigration', 'immigration', 'Visa, H1B, green card, and immigration topics', '🌍', '#f97316')
ON CONFLICT (slug) DO NOTHING;

-- User topic follows
CREATE TABLE IF NOT EXISTS user_topic_follows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, topic_id)
);

-- ============================================
-- SALARY & COMPENSATION MODULE
-- ============================================
CREATE TABLE IF NOT EXISTS salary_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  company_name TEXT NOT NULL,
  job_title TEXT NOT NULL,
  level TEXT, -- e.g., IC1, IC2, L3, L4, Senior, Staff
  years_experience INT,
  years_at_company INT,
  location TEXT,
  base_salary INT NOT NULL,
  bonus INT DEFAULT 0,
  stock_annual INT DEFAULT 0, -- Annual RSU/equity value
  total_compensation INT GENERATED ALWAYS AS (base_salary + bonus + stock_annual) STORED,
  currency TEXT DEFAULT 'USD',
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_salary_company ON salary_entries(company_name);
CREATE INDEX idx_salary_title ON salary_entries(job_title);
CREATE INDEX idx_salary_location ON salary_entries(location);

-- ============================================
-- COMPANY REVIEWS
-- ============================================
CREATE TABLE IF NOT EXISTS company_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  company_name TEXT NOT NULL,
  job_title TEXT,
  employment_status TEXT CHECK (employment_status IN ('current', 'former')) DEFAULT 'current',
  overall_rating INT CHECK (overall_rating >= 1 AND overall_rating <= 5),
  culture_rating INT CHECK (culture_rating >= 1 AND culture_rating <= 5),
  leadership_rating INT CHECK (leadership_rating >= 1 AND leadership_rating <= 5),
  compensation_rating INT CHECK (compensation_rating >= 1 AND compensation_rating <= 5),
  worklife_rating INT CHECK (worklife_rating >= 1 AND worklife_rating <= 5),
  growth_rating INT CHECK (growth_rating >= 1 AND growth_rating <= 5),
  pros TEXT,
  cons TEXT,
  advice_to_management TEXT,
  is_verified BOOLEAN DEFAULT false,
  helpful_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_reviews_company ON company_reviews(company_name);

-- ============================================
-- DIRECT MESSAGES
-- ============================================
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT CHECK (type IN ('dm', 'group')) DEFAULT 'dm',
  name TEXT, -- For group chats
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS conversation_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT now(),
  last_read_at TIMESTAMPTZ DEFAULT now(),
  is_muted BOOLEAN DEFAULT false,
  UNIQUE(conversation_id, user_id)
);

CREATE TABLE IF NOT EXISTS direct_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_messages_conversation ON direct_messages(conversation_id);
CREATE INDEX idx_messages_sender ON direct_messages(sender_id);

-- ============================================
-- BOOKMARKS / SAVED POSTS
-- ============================================
CREATE TABLE IF NOT EXISTS bookmarks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, post_id)
);

-- ============================================
-- USER COMPANY FOLLOWS
-- ============================================
CREATE TABLE IF NOT EXISTS user_company_follows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, company_id)
);

-- ============================================
-- WORK EMAIL VERIFICATION
-- ============================================
CREATE TABLE IF NOT EXISTS email_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  work_email TEXT NOT NULL,
  work_email_domain TEXT NOT NULL,
  verification_code TEXT NOT NULL,
  is_verified BOOLEAN DEFAULT false,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  verified_at TIMESTAMPTZ
);

CREATE INDEX idx_email_verifications_user ON email_verifications(user_id);

-- ============================================
-- MODERATION & REPORTING
-- ============================================
ALTER TABLE reports ADD COLUMN IF NOT EXISTS target_comment_id UUID REFERENCES comments(id) ON DELETE SET NULL;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS target_user_id UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS report_type TEXT DEFAULT 'spam';
ALTER TABLE reports ADD COLUMN IF NOT EXISTS moderator_notes TEXT;

-- User blocks
CREATE TABLE IF NOT EXISTS user_blocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  blocker_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(blocker_id, blocked_id)
);

-- ============================================
-- UPDATE POSTS TABLE FOR TOPICS
-- ============================================
ALTER TABLE posts ADD COLUMN IF NOT EXISTS topic_id UUID REFERENCES topics(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_posts_topic ON posts(topic_id);

-- ============================================
-- UPDATE USERS TABLE
-- ============================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS work_email TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS work_email_verified BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS verified_company_id UUID REFERENCES companies(id) ON DELETE SET NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{"email": true, "push": true, "dm": true}';

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_user_topic_follows_user ON user_topic_follows(user_id);
CREATE INDEX IF NOT EXISTS idx_user_topic_follows_topic ON user_topic_follows(topic_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user ON conversation_participants(user_id);

