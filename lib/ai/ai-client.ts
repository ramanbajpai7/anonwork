// AI Client - Core LLM Integration
// Supports multiple providers with mock mode for development

import { aiConfig, isAIMockMode } from './config'
import { PROMPTS, fillPrompt } from './prompts'
import { anonymizeText, checkPrivacy, anonymizeThread } from './anonymize'
import type {
  ModerationResult,
  SummarizeResult,
  TitleSuggestion,
  TagSuggestion,
  RewriteResult,
  RedactedResult,
  PrivacyCheckResult,
  QAResult,
} from './types'

// Simple in-memory cache
const cache = new Map<string, { data: any; expires: number }>()

function getCached<T>(key: string): T | null {
  const entry = cache.get(key)
  if (entry && entry.expires > Date.now()) {
    return entry.data as T
  }
  cache.delete(key)
  return null
}

function setCache(key: string, data: any, ttlSeconds: number = aiConfig.cacheTTL): void {
  cache.set(key, {
    data,
    expires: Date.now() + ttlSeconds * 1000,
  })
}

// Generate cache key from input
function cacheKey(prefix: string, input: string): string {
  // Simple hash for cache key
  let hash = 0
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return `${prefix}:${hash}`
}

/**
 * Call the LLM provider
 */
async function callLLM(prompt: string): Promise<string> {
  if (isAIMockMode()) {
    // Return mock response for development
    return mockLLMResponse(prompt)
  }

  switch (aiConfig.provider) {
    case 'huggingface':
      return callHuggingFace(prompt)
    case 'groq':
      return callGroq(prompt)
    case 'ollama':
      return callOllama(prompt)
    default:
      return mockLLMResponse(prompt)
  }
}

async function callHuggingFace(prompt: string): Promise<string> {
  const response = await fetch(
    `https://api-inference.huggingface.co/models/${aiConfig.modelId}`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${aiConfig.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          max_new_tokens: aiConfig.maxTokens,
          temperature: aiConfig.temperature,
          return_full_text: false,
        },
      }),
    }
  )

  if (!response.ok) {
    throw new Error(`HuggingFace API error: ${response.statusText}`)
  }

  const data = await response.json()
  return data[0]?.generated_text || ''
}

async function callGroq(prompt: string): Promise<string> {
  if (!aiConfig.apiKey) {
    console.error('Groq API key is not configured. Set GROQ_API_KEY in environment variables.')
    throw new Error('Groq API key is not configured')
  }

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${aiConfig.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: aiConfig.modelId || 'mixtral-8x7b-32768',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: aiConfig.maxTokens,
      temperature: aiConfig.temperature,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('Groq API error:', response.status, errorText)
    throw new Error(`Groq API error: ${response.status} - ${response.statusText}`)
  }

  const data = await response.json()
  return data.choices?.[0]?.message?.content || ''
}

async function callOllama(prompt: string): Promise<string> {
  const ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434'
  const response = await fetch(`${ollamaUrl}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: aiConfig.modelId,
      prompt,
      stream: false,
    }),
  })

  if (!response.ok) {
    throw new Error(`Ollama API error: ${response.statusText}`)
  }

  const data = await response.json()
  return data.response || ''
}

/**
 * Parse JSON from LLM response (handles markdown code blocks)
 */
function parseJSON<T>(text: string): T {
  // Try to extract JSON from markdown code blocks
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  const jsonStr = jsonMatch ? jsonMatch[1] : text

  // Clean up common issues
  const cleaned = jsonStr
    .trim()
    .replace(/^[^{[]*/, '') // Remove leading non-JSON
    .replace(/[^}\]]*$/, '') // Remove trailing non-JSON

  try {
    return JSON.parse(cleaned)
  } catch (e) {
    console.error('Failed to parse LLM JSON response:', text)
    throw new Error('Failed to parse AI response')
  }
}

// ============================================
// MOCK RESPONSES FOR DEVELOPMENT
// ============================================

function mockLLMResponse(prompt: string): string {
  // Detect prompt type and return appropriate mock
  if (prompt.includes('Summarize the following discussion')) {
    return JSON.stringify({
      summary: 'This discussion covers various workplace topics with multiple perspectives shared.',
      bulletPoints: [
        'Users discussed compensation and benefits',
        'Work-life balance was a recurring theme',
        'Several shared experiences with management',
        'The community provided supportive feedback',
      ],
      keyTopics: ['compensation', 'work-life balance', 'management'],
    })
  }

  if (prompt.includes('suggest 3 different titles')) {
    return JSON.stringify({
      suggestions: [
        { title: 'Seeking Advice on Career Transition', style: 'professional' },
        { title: 'Is This Offer Worth It? Need Your Thoughts!', style: 'engaging' },
        { title: 'Career advice needed', style: 'concise' },
      ],
    })
  }

  if (prompt.includes('suggest 2-4 relevant tags')) {
    return JSON.stringify({
      tags: [
        { name: 'Career Advice', confidence: 0.92 },
        { name: 'Compensation', confidence: 0.85 },
        { name: 'Tech Industry', confidence: 0.78 },
      ],
    })
  }

  if (prompt.includes('Rewrite the following text')) {
    return JSON.stringify({
      rewritten: 'This is a professionally rewritten version of the original text with improved clarity and structure.',
      changes: ['Improved sentence structure', 'Made language more professional', 'Clarified main points'],
    })
  }

  if (prompt.includes('Classify the following content')) {
    return JSON.stringify({
      label: 'safe',
      confidence: 0.95,
      flagged: false,
      reasons: [],
    })
  }

  if (prompt.includes('Find and redact personal identifiers')) {
    return JSON.stringify({
      redacted: 'The text with [EMAIL] and [NAME] redacted.',
      changes: [],
      riskLevel: 'low',
    })
  }

  if (prompt.includes('answer the user\'s question')) {
    return JSON.stringify({
      answer: 'Based on the community discussions, here is what people are saying about this topic...',
      confidence: 0.75,
      sources: ['Relevant discussion point 1', 'Relevant discussion point 2'],
    })
  }

  return JSON.stringify({ result: 'Mock response' })
}

// ============================================
// PUBLIC API
// ============================================

/**
 * Summarize a thread or post with comments
 */
export async function summarizeContent(
  posts: Array<{ username: string; content: string }>
): Promise<SummarizeResult> {
  const anonymized = anonymizeThread(posts)
  const key = cacheKey('summarize', anonymized)

  // Check cache
  const cached = getCached<SummarizeResult>(key)
  if (cached) return cached

  const prompt = fillPrompt(PROMPTS.SUMMARIZE, { content: anonymized })
  const response = await callLLM(prompt)
  const result = parseJSON<SummarizeResult>(response)

  // Add word count
  result.wordCount = anonymized.split(/\s+/).length

  setCache(key, result)
  return result
}

/**
 * Suggest titles for a post
 */
export async function suggestTitles(content: string): Promise<TitleSuggestion[]> {
  const { redacted } = anonymizeText(content)
  const key = cacheKey('titles', redacted)

  const cached = getCached<TitleSuggestion[]>(key)
  if (cached) return cached

  const prompt = fillPrompt(PROMPTS.SUGGEST_TITLE, { content: redacted })
  const response = await callLLM(prompt)
  const parsed = parseJSON<{ suggestions: TitleSuggestion[] }>(response)

  setCache(key, parsed.suggestions)
  return parsed.suggestions
}

/**
 * Suggest tags/categories for a post
 */
export async function suggestTags(title: string, content: string): Promise<TagSuggestion[]> {
  const { redacted: redactedContent } = anonymizeText(content)
  const key = cacheKey('tags', `${title}:${redactedContent}`)

  const cached = getCached<TagSuggestion[]>(key)
  if (cached) return cached

  const prompt = fillPrompt(PROMPTS.SUGGEST_TAGS, { title, content: redactedContent })
  const response = await callLLM(prompt)
  const parsed = parseJSON<{ tags: TagSuggestion[] }>(response)

  // Mark as not existing (caller should check against DB)
  const tags = parsed.tags.map(t => ({ ...t, isExisting: false }))

  setCache(key, tags)
  return tags
}

/**
 * Rewrite text for clarity
 */
export async function rewriteContent(
  content: string,
  style: 'professional' | 'clear' | 'concise' = 'professional'
): Promise<RewriteResult> {
  const prompt = fillPrompt(PROMPTS.REWRITE, { content, style })
  const response = await callLLM(prompt)
  const parsed = parseJSON<{ rewritten: string; changes: string[] }>(response)

  return {
    original: content,
    rewritten: parsed.rewritten,
    changes: parsed.changes,
    style,
  }
}

/**
 * Moderate content for toxicity
 */
export async function moderateContent(content: string): Promise<ModerationResult> {
  // First do a quick pattern-based check
  const privacyCheck = checkPrivacy(content)
  
  // Check for obvious PII first
  if (privacyCheck.warnings.some(w => w.severity === 'critical')) {
    return {
      label: 'doxxing',
      confidence: 0.99,
      flagged: true,
      reasons: privacyCheck.warnings
        .filter(w => w.severity === 'critical')
        .map(w => w.message),
      detectedIdentifiers: privacyCheck.warnings
        .filter(w => w.severity === 'critical')
        .map(w => w.type),
    }
  }

  // Then do LLM-based moderation
  const { redacted } = anonymizeText(content)
  const prompt = fillPrompt(PROMPTS.MODERATE, { content: redacted })
  const response = await callLLM(prompt)
  const result = parseJSON<ModerationResult>(response)

  return result
}

/**
 * Redact personal information from text
 */
export async function redactContent(
  content: string,
  level: 'basic' | 'paranoid' = 'basic'
): Promise<RedactedResult> {
  // Use regex-based redaction for basic level
  if (level === 'basic') {
    return anonymizeText(content, {
      removeEmails: true,
      removePhones: true,
      removeIds: true,
      removeUrls: false,
      removeCompanyNames: false,
      removeNames: false,
    })
  }

  // For paranoid level, use LLM for more thorough detection
  const prompt = fillPrompt(PROMPTS.REDACT, { content })
  const response = await callLLM(prompt)
  return parseJSON<RedactedResult>(response)
}

/**
 * Check content for privacy risks
 */
export { checkPrivacy }

/**
 * Answer a question based on community posts
 */
export async function answerQuestion(
  question: string,
  contextPosts: Array<{ username: string; content: string }>
): Promise<QAResult> {
  const context = anonymizeThread(contextPosts)
  const prompt = fillPrompt(PROMPTS.QA, { question, context })
  const response = await callLLM(prompt)
  
  const parsed = parseJSON<{
    answer: string
    confidence: number
    sources: string[]
  }>(response)

  return {
    answer: parsed.answer,
    confidence: parsed.confidence,
    sources: parsed.sources.map((snippet, i) => ({
      postId: 'anonymous',
      snippet,
      relevance: 1 - (i * 0.1),
    })),
  }
}

// Export the anonymization utilities
export { anonymizeText, anonymizeThread }
