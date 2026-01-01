// Text Anonymization Utilities
// Strips identifying information before sending to LLM

import type { RedactionChange, RedactedResult, PrivacyCheckResult, PrivacyWarning } from './types'

// Common regex patterns for PII detection
const PATTERNS = {
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/gi,
  phone: /(\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
  url: /https?:\/\/[^\s<>"{}|\\^`[\]]+/gi,
  // Social security, employee IDs, etc.
  idNumber: /\b\d{3}[-\s]?\d{2}[-\s]?\d{4}\b|\b[A-Z]{2,3}\d{6,}\b/gi,
  // IP addresses
  ipAddress: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g,
}

// Common company name patterns to detect
const COMPANY_KEYWORDS = [
  'Google', 'Meta', 'Facebook', 'Amazon', 'Apple', 'Microsoft', 'Netflix',
  'Uber', 'Lyft', 'Airbnb', 'Stripe', 'Coinbase', 'OpenAI', 'Anthropic',
  'Twitter', 'X Corp', 'LinkedIn', 'Salesforce', 'Oracle', 'IBM',
  'Tesla', 'SpaceX', 'Nvidia', 'AMD', 'Intel', 'Qualcomm',
  'Goldman Sachs', 'JP Morgan', 'Morgan Stanley', 'Citadel',
  'McKinsey', 'BCG', 'Bain', 'Deloitte', 'KPMG', 'EY', 'PwC',
]

// Map of company to generic replacement
const COMPANY_REPLACEMENTS: Record<string, string> = {
  'Google': 'a major tech company',
  'Meta': 'a major tech company',
  'Facebook': 'a major social media company',
  'Amazon': 'a major e-commerce/cloud company',
  'Apple': 'a major tech company',
  'Microsoft': 'a major tech company',
  'Netflix': 'a major streaming company',
  'Uber': 'a rideshare company',
  'Lyft': 'a rideshare company',
  'Airbnb': 'a hospitality tech company',
  'OpenAI': 'an AI company',
  'Anthropic': 'an AI company',
  'Tesla': 'an electric vehicle company',
  'Goldman Sachs': 'a major investment bank',
  'JP Morgan': 'a major bank',
  'McKinsey': 'a consulting firm',
}

// Simple name detection (proper nouns that look like names)
// This is basic - LLM can do better for context-aware detection
const NAME_PATTERN = /\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/g

interface AnonymizeOptions {
  removeEmails?: boolean
  removePhones?: boolean
  removeUrls?: boolean
  removeIds?: boolean
  removeCompanyNames?: boolean
  removeNames?: boolean
  replaceUsernames?: boolean
}

const DEFAULT_OPTIONS: AnonymizeOptions = {
  removeEmails: true,
  removePhones: true,
  removeUrls: false,
  removeIds: true,
  removeCompanyNames: false,
  removeNames: false,
  replaceUsernames: true,
}

/**
 * Anonymize text by removing PII before sending to LLM
 */
export function anonymizeText(
  text: string,
  options: AnonymizeOptions = DEFAULT_OPTIONS
): RedactedResult {
  let result = text
  const changes: RedactionChange[] = []
  let position = 0

  // Remove emails
  if (options.removeEmails) {
    result = result.replace(PATTERNS.email, (match) => {
      changes.push({
        type: 'email',
        original: match,
        replacement: '[EMAIL]',
        position: { start: position, end: position + match.length },
      })
      return '[EMAIL]'
    })
  }

  // Remove phone numbers
  if (options.removePhones) {
    result = result.replace(PATTERNS.phone, (match) => {
      changes.push({
        type: 'phone',
        original: match,
        replacement: '[PHONE]',
        position: { start: position, end: position + match.length },
      })
      return '[PHONE]'
    })
  }

  // Remove URLs
  if (options.removeUrls) {
    result = result.replace(PATTERNS.url, (match) => {
      changes.push({
        type: 'url',
        original: match,
        replacement: '[URL]',
        position: { start: position, end: position + match.length },
      })
      return '[URL]'
    })
  }

  // Remove ID numbers
  if (options.removeIds) {
    result = result.replace(PATTERNS.idNumber, (match) => {
      changes.push({
        type: 'id_number',
        original: match,
        replacement: '[ID]',
        position: { start: position, end: position + match.length },
      })
      return '[ID]'
    })
  }

  // Replace company names with generic terms
  if (options.removeCompanyNames) {
    for (const company of COMPANY_KEYWORDS) {
      const regex = new RegExp(`\\b${company}\\b`, 'gi')
      result = result.replace(regex, (match) => {
        const replacement = COMPANY_REPLACEMENTS[company] || 'a company'
        changes.push({
          type: 'company',
          original: match,
          replacement,
          position: { start: position, end: position + match.length },
        })
        return replacement
      })
    }
  }

  // Calculate risk level
  let riskLevel: 'low' | 'medium' | 'high' = 'low'
  if (changes.length > 0) {
    const hasEmail = changes.some(c => c.type === 'email')
    const hasPhone = changes.some(c => c.type === 'phone')
    const hasName = changes.some(c => c.type === 'name')
    
    if (hasEmail || hasPhone || hasName) {
      riskLevel = 'high'
    } else if (changes.length > 2) {
      riskLevel = 'medium'
    }
  }

  return {
    original: text,
    redacted: result,
    changes,
    riskLevel,
  }
}

/**
 * Check text for privacy risks without modifying it
 */
export function checkPrivacy(text: string): PrivacyCheckResult {
  const warnings: PrivacyWarning[] = []
  let riskScore = 0

  // Check for emails
  const emails = text.match(PATTERNS.email)
  if (emails) {
    emails.forEach(email => {
      warnings.push({
        type: 'email',
        message: `Email address detected: ${email.substring(0, 3)}...`,
        severity: 'critical',
        suggestion: 'Remove or replace the email address with [EMAIL]',
      })
      riskScore += 30
    })
  }

  // Check for phone numbers
  const phones = text.match(PATTERNS.phone)
  if (phones) {
    phones.forEach(() => {
      warnings.push({
        type: 'phone',
        message: 'Phone number detected',
        severity: 'critical',
        suggestion: 'Remove or replace the phone number with [PHONE]',
      })
      riskScore += 30
    })
  }

  // Check for company names (less severe)
  for (const company of COMPANY_KEYWORDS.slice(0, 20)) {
    const regex = new RegExp(`\\b${company}\\b`, 'i')
    if (regex.test(text)) {
      warnings.push({
        type: 'company',
        message: `Company name "${company}" detected`,
        severity: 'info',
        suggestion: `Consider replacing with generic term like "a tech company"`,
      })
      riskScore += 5
    }
  }

  // Check for potential names (basic heuristic)
  const potentialNames = text.match(NAME_PATTERN)
  if (potentialNames && potentialNames.length > 0) {
    // Filter out common false positives
    const filtered = potentialNames.filter(name => 
      !COMPANY_KEYWORDS.some(c => name.includes(c)) &&
      !['New York', 'San Francisco', 'Los Angeles', 'United States'].includes(name)
    )
    if (filtered.length > 0) {
      warnings.push({
        type: 'name',
        message: 'Potential names detected in your text',
        severity: 'warning',
        suggestion: 'Consider removing or replacing names with generic terms',
      })
      riskScore += 15 * filtered.length
    }
  }

  // Check for URLs
  const urls = text.match(PATTERNS.url)
  if (urls) {
    urls.forEach(url => {
      // LinkedIn and personal portfolio sites are higher risk
      if (url.includes('linkedin.com') || url.includes('github.com')) {
        warnings.push({
          type: 'url',
          message: 'Profile URL detected - may reveal identity',
          severity: 'critical',
          suggestion: 'Remove personal profile links',
        })
        riskScore += 25
      } else {
        warnings.push({
          type: 'url',
          message: 'URL detected',
          severity: 'info',
          suggestion: 'Consider if this URL could identify you',
        })
        riskScore += 5
      }
    })
  }

  return {
    safe: riskScore < 20,
    warnings,
    riskScore: Math.min(100, riskScore),
  }
}

/**
 * Replace usernames in thread content for LLM context
 */
export function anonymizeThread(
  posts: Array<{ username: string; content: string }>
): string {
  const usernameMap = new Map<string, string>()
  let userCounter = 1

  return posts.map(({ username, content }) => {
    if (!usernameMap.has(username)) {
      usernameMap.set(username, `[User ${userCounter++}]`)
    }
    const anonUsername = usernameMap.get(username)!
    
    // Also anonymize the content
    const { redacted } = anonymizeText(content)
    
    return `${anonUsername}: ${redacted}`
  }).join('\n\n')
}

/**
 * Extract and mask domains from email addresses
 */
export function extractWorkDomain(email: string): string | null {
  const match = email.match(/@([^@]+)$/)
  if (match) {
    const domain = match[1].toLowerCase()
    // Skip common personal email providers
    const personalDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com']
    if (!personalDomains.includes(domain)) {
      return domain
    }
  }
  return null
}
