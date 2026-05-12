// ============================================
// AI SERVICE - Content Intelligence
// ============================================
// Isolated service for AI operations (Groq, HuggingFace)
// Uses Redis caching for expensive LLM calls
// ============================================

const express = require('express');
const { getCache, setCache } = require('../../shared/redis');

const app = express();
const PORT = process.env.AI_SERVICE_PORT || 4005;
app.use(express.json());

const AI_CONFIG = {
  provider: process.env.AI_PROVIDER || 'groq',
  apiKey: process.env.GROQ_API_KEY || process.env.HUGGINGFACE_API_KEY,
  modelId: process.env.AI_MODEL_ID || 'llama-3.3-70b-versatile',
  maxTokens: parseInt(process.env.AI_MAX_TOKENS || '1024'),
  temperature: parseFloat(process.env.AI_TEMPERATURE || '0.7'),
};

// ============ LLM CALL ============

async function callGroq(prompt) {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${AI_CONFIG.apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: AI_CONFIG.modelId,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: AI_CONFIG.maxTokens,
      temperature: AI_CONFIG.temperature,
    }),
  });
  if (!res.ok) throw new Error(`Groq error: ${res.status}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash = hash & hash;
  }
  return hash.toString();
}

// ============ ENDPOINTS ============

// POST /api/ai/moderate
app.post('/api/ai/moderate', async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ message: 'Content required' });
    const cacheKey = `ai:moderate:${hashString(content)}`;
    const cached = await getCache(cacheKey);
    if (cached) return res.json(cached);

    const prompt = `Classify the following content for moderation. Return JSON: {"label":"safe|toxic|spam|doxxing","confidence":0.0-1.0,"flagged":bool,"reasons":[]}\n\nContent: "${content.slice(0, 500)}"`;
    const result = JSON.parse(await callGroq(prompt));
    await setCache(cacheKey, result, 3600);
    return res.json(result);
  } catch (error) {
    console.error('[AI] Moderate error:', error.message);
    return res.json({ label: 'safe', confidence: 0.5, flagged: false, reasons: [] });
  }
});

// POST /api/ai/summarize
app.post('/api/ai/summarize', async (req, res) => {
  try {
    const { posts } = req.body;
    if (!posts?.length) return res.status(400).json({ message: 'Posts required' });
    const text = posts.map(p => `${p.username}: ${p.content}`).join('\n');
    const cacheKey = `ai:summarize:${hashString(text)}`;
    const cached = await getCache(cacheKey);
    if (cached) return res.json(cached);

    const prompt = `Summarize the following discussion. Return JSON: {"summary":"...","bulletPoints":["..."],"keyTopics":["..."]}\n\n${text.slice(0, 2000)}`;
    const result = JSON.parse(await callGroq(prompt));
    await setCache(cacheKey, result, 3600);
    return res.json(result);
  } catch (error) {
    console.error('[AI] Summarize error:', error.message);
    return res.status(500).json({ message: 'AI service error' });
  }
});

// POST /api/ai/suggest-title
app.post('/api/ai/suggest-title', async (req, res) => {
  try {
    const { content } = req.body;
    const prompt = `Based on this post content, suggest 3 titles. Return JSON: {"suggestions":[{"title":"...","style":"professional|engaging|concise"}]}\n\n${content?.slice(0, 500)}`;
    const result = JSON.parse(await callGroq(prompt));
    return res.json(result);
  } catch (error) { return res.status(500).json({ message: 'AI service error' }); }
});

// POST /api/ai/suggest-tags
app.post('/api/ai/suggest-tags', async (req, res) => {
  try {
    const { title, content } = req.body;
    const prompt = `Suggest 2-4 tags for this post. Return JSON: {"tags":[{"name":"...","confidence":0.0-1.0}]}\n\nTitle: ${title}\nContent: ${content?.slice(0, 500)}`;
    const result = JSON.parse(await callGroq(prompt));
    return res.json(result);
  } catch (error) { return res.status(500).json({ message: 'AI service error' }); }
});

// POST /api/ai/rewrite
app.post('/api/ai/rewrite', async (req, res) => {
  try {
    const { content, style = 'professional' } = req.body;
    const prompt = `Rewrite this text in a ${style} style. Return JSON: {"rewritten":"...","changes":["..."]}\n\n${content?.slice(0, 1000)}`;
    const result = JSON.parse(await callGroq(prompt));
    return res.json(result);
  } catch (error) { return res.status(500).json({ message: 'AI service error' }); }
});

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'ai-service' }));

app.listen(PORT, () => console.log(`[AI Service] 🟢 Running on port ${PORT}`));
module.exports = app;
