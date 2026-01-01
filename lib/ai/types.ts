// AI Service Type Definitions

export type AIProvider = 'huggingface' | 'groq' | 'ollama' | 'mock'

export type ModerationLabel = 'safe' | 'harassment' | 'doxxing' | 'hate' | 'spam'

export interface ModerationResult {
  label: ModerationLabel
  confidence: number
  flagged: boolean
  reasons: string[]
  detectedIdentifiers?: string[]
}

export interface SummarizeResult {
  summary: string
  bulletPoints: string[]
  keyTopics: string[]
  wordCount: number
}

export interface TitleSuggestion {
  title: string
  style: 'professional' | 'engaging' | 'concise'
}

export interface TagSuggestion {
  id?: string
  name: string
  confidence: number
  isExisting: boolean
}

export interface RewriteResult {
  original: string
  rewritten: string
  changes: string[]
  style: string
}

export interface RedactedResult {
  original: string
  redacted: string
  changes: RedactionChange[]
  riskLevel: 'low' | 'medium' | 'high'
}

export interface RedactionChange {
  type: 'email' | 'phone' | 'name' | 'company' | 'url' | 'id_number'
  original: string
  replacement: string
  position: { start: number; end: number }
}

export interface PrivacyCheckResult {
  safe: boolean
  warnings: PrivacyWarning[]
  riskScore: number
}

export interface PrivacyWarning {
  type: RedactionChange['type']
  message: string
  severity: 'info' | 'warning' | 'critical'
  suggestion: string
}

export interface QAResult {
  answer: string
  sources: QASource[]
  confidence: number
}

export interface QASource {
  postId: string
  snippet: string
  relevance: number
}

export interface AIUsageLog {
  userId: string
  endpoint: string
  tokensUsed: number
  latencyMs: number
  cached: boolean
  timestamp: Date
}

export interface AIConfig {
  provider: AIProvider
  apiKey?: string
  modelId: string
  maxTokens: number
  temperature: number
  rateLimitPerUser: number
  cacheTTL: number
  features: {
    summarization: boolean
    smartCompose: boolean
    moderation: boolean
    anonymization: boolean
    qa: boolean
    personalization: boolean
  }
}
