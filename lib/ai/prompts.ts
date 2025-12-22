// AI Prompt Templates for LLM Interactions

export const PROMPTS = {
  // Thread Summarization
  SUMMARIZE: `You are a helpful assistant summarizing anonymous workplace discussions.

Summarize the following discussion in 3-5 bullet points. Be neutral and factual.
Do not include any usernames or identifying information.
Focus on the main points, key arguments, and any conclusions reached.

Discussion:
{content}

Respond with a JSON object:
{
  "summary": "Brief 1-2 sentence overview",
  "bulletPoints": ["Point 1", "Point 2", "Point 3"],
  "keyTopics": ["topic1", "topic2"]
}`,

  // Title Suggestions
  SUGGEST_TITLE: `You are helping users write better post titles for an anonymous workplace forum.

Based on the following post content, suggest 3 different titles:
1. Professional and descriptive
2. Engaging and click-worthy (but not clickbait)
3. Concise and direct

Post content:
{content}

Respond with a JSON object:
{
  "suggestions": [
    {"title": "Title 1", "style": "professional"},
    {"title": "Title 2", "style": "engaging"},
    {"title": "Title 3", "style": "concise"}
  ]
}`,

  // Tag Suggestions
  SUGGEST_TAGS: `You are categorizing posts for an anonymous workplace forum.

Available categories: Career Advice, Offer Evaluation, Tech Industry, Compensation, Work-Life Balance, Company Culture, Interview Prep, Job Search, Remote Work, Management, Layoffs, Promotions

Based on this post, suggest 2-4 relevant tags:

Title: {title}
Content: {content}

Respond with a JSON object:
{
  "tags": [
    {"name": "Category Name", "confidence": 0.95}
  ]
}`,

  // Content Rewriting
  REWRITE: `You are helping users communicate more clearly on an anonymous workplace forum.

Rewrite the following text to be more {style}. Keep the same meaning but improve:
- Clarity and readability
- Professional tone
- Remove any identifying writing patterns

Original text:
{content}

Respond with a JSON object:
{
  "rewritten": "The improved text here",
  "changes": ["Made language more professional", "Clarified main point"]
}`,

  // Content Moderation
  MODERATE: `You are a content moderator for an anonymous workplace forum.

Classify the following content into one of these categories:
- safe: Normal workplace discussion
- harassment: Personal attacks, bullying, threats
- doxxing: Contains personal identifiable information (names, emails, phone numbers)
- hate: Discriminatory content based on protected characteristics
- spam: Off-topic promotions or repetitive content

Content:
{content}

Respond with a JSON object:
{
  "label": "safe|harassment|doxxing|hate|spam",
  "confidence": 0.95,
  "flagged": true|false,
  "reasons": ["Reason 1 if flagged"]
}`,

  // Text Redaction
  REDACT: `You are a privacy protection assistant for an anonymous workplace forum.

Find and redact personal identifiers in this text. Replace:
- Real names with [NAME]
- Email addresses with [EMAIL]
- Phone numbers with [PHONE]
- Company names with generic terms like "tech company" or "FAANG company"
- URLs with [URL]
- ID numbers with [ID]

Text:
{content}

Respond with a JSON object:
{
  "redacted": "The text with redactions",
  "changes": [
    {"type": "email", "original": "john@example.com", "replacement": "[EMAIL]"}
  ],
  "riskLevel": "low|medium|high"
}`,

  // Q&A
  QA: `You are an assistant answering questions about anonymous workplace discussions.

Based on the following posts from the community, answer the user's question.
Do not reveal any usernames or identifying information.
If you don't have enough information, say so.

Context posts:
{context}

Question: {question}

Respond with a JSON object:
{
  "answer": "Your helpful answer here",
  "confidence": 0.8,
  "sources": ["Brief relevant quote 1", "Brief relevant quote 2"]
}`,
}

// Helper to fill in prompt templates
export function fillPrompt(template: string, variables: Record<string, string>): string {
  let result = template
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value)
  }
  return result
}
