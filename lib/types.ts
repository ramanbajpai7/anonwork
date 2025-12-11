// Type definitions for AnonWork platform

export type UserRole = "user" | "admin" | "moderator"
export type VerificationStatus = "pending" | "approved" | "rejected"
export type ChannelType = "company" | "topic"
export type PostStatus = "active" | "removed" | "hidden"
export type CommentStatus = "active" | "removed"
export type ReportStatus = "open" | "reviewed" | "actioned"
export type NotificationType = "comment" | "mention" | "poll_result" | "moderator_message"

export interface User {
  id: string
  email?: string
  email_verified: boolean
  work_email?: string
  work_email_domain?: string
  work_email_verified: boolean
  anon_username: string
  display_name?: string
  role: UserRole
  is_verified_employee: boolean
  verified_company_id?: string
  profile_photo_url?: string
  profile_meta: Record<string, any>
  created_at: string
  updated_at: string
  last_active_at: string
}

export interface Company {
  id: string
  name: string
  domain?: string
  verified: boolean
  created_at: string
  updated_at: string
}

export interface Channel {
  id: string
  name: string
  type: ChannelType
  company_id?: string
  description?: string
  is_private: boolean
  created_at: string
  updated_at: string
}

export interface Post {
  id: string
  author_id: string
  channel_id?: string
  title?: string
  body: string
  is_anonymous: boolean
  metadata: Record<string, any>
  score: number
  views: number
  status: PostStatus
  created_at: string
  updated_at: string
}

export interface Comment {
  id: string
  post_id: string
  author_id: string
  body: string
  parent_comment_id?: string
  status: CommentStatus
  created_at: string
  updated_at: string
}

export interface Poll {
  id: string
  post_id: string
  question: string
  options: Array<{ id: string; label: string; votes?: number }>
  allow_multiple: boolean
  created_at: string
  expires_at?: string
}

export interface PollVote {
  id: string
  poll_id: string
  user_id: string
  option_id: string
  created_at: string
}

export interface PostVote {
  id: string
  post_id: string
  user_id: string
  vote: -1 | 0 | 1
  created_at: string
}

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  payload: Record<string, any>
  read: boolean
  created_at: string
}

export interface Report {
  id: string
  reporter_id: string
  target_post_id?: string
  reason: string
  status: ReportStatus
  created_at: string
  reviewed_at?: string
  action_taken_by?: string
}

export interface Attachment {
  id: string
  post_id: string
  s3_key: string
  mime?: string
  size?: number
  created_at: string
}

export interface UserCompanyVerification {
  id: string
  user_id: string
  company_id: string
  status: VerificationStatus
  proof_email?: string
  requested_at: string
  approved_at?: string
  updated_at: string
}
