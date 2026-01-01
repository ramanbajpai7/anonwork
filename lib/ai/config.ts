// AI Service Configuration

import type { AIConfig, AIProvider } from './types'

function getProvider(): AIProvider {
  const provider = process.env.AI_PROVIDER as AIProvider
  if (provider && ['huggingface', 'groq', 'ollama', 'mock'].includes(provider)) {
    return provider
  }
  return 'mock' // Default to mock for development
}

function getApiKey(provider: AIProvider): string | undefined {
  switch (provider) {
    case 'groq':
      return process.env.GROQ_API_KEY
    case 'huggingface':
      return process.env.HUGGINGFACE_API_KEY
    default:
      return undefined
  }
}

const currentProvider = getProvider()

export const aiConfig: AIConfig = {
  provider: currentProvider,
  apiKey: getApiKey(currentProvider),
  modelId: process.env.AI_MODEL_ID || 'llama-3.3-70b-versatile',
  maxTokens: parseInt(process.env.AI_MAX_TOKENS || '1024'),
  temperature: parseFloat(process.env.AI_TEMPERATURE || '0.7'),
  rateLimitPerUser: parseInt(process.env.AI_RATE_LIMIT_PER_USER || '50'),
  cacheTTL: parseInt(process.env.AI_CACHE_TTL || '3600'),
  features: {
    summarization: process.env.AI_FEATURE_SUMMARIZE !== 'false',
    smartCompose: process.env.AI_FEATURE_COMPOSE !== 'false',
    moderation: process.env.AI_FEATURE_MODERATE !== 'false',
    anonymization: process.env.AI_FEATURE_ANONYMIZE !== 'false',
    qa: process.env.AI_FEATURE_QA !== 'false',
    personalization: process.env.AI_FEATURE_PERSONALIZE !== 'false',
  },
}

// Feature flag helpers
export function isFeatureEnabled(feature: keyof AIConfig['features']): boolean {
  return aiConfig.features[feature]
}

export function getAIProvider(): AIProvider {
  return aiConfig.provider
}

export function isAIMockMode(): boolean {
  return aiConfig.provider === 'mock'
}
