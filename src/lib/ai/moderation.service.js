import crypto from 'crypto';
import { buildModerationPrompt } from './moderation.prompts.js';
import { validateModerationOutput, createFallbackReport } from './moderation.schema.js';

// In-memory LRU cache to avoid repeated LLM calls for identical comment content
const moderationCache = new Map();
const MAX_CACHE_ENTRIES = 500;

function hashCommentText(text) {
  if (!text) return '';
  return crypto.createHash('sha256').update(String(text).trim()).digest('hex');
}

/**
 * TechyBlogs AI — Comment Moderation Intelligence Service
 */
export async function analyzeCommentContent({
  text,
  articleTitle = '',
  parentCommentText = '',
  forceFresh = false,
}) {
  if (!text || typeof text !== 'string' || text.trim().length < 2) {
    return {
      status: 'skipped',
      classification: 'safe',
      severity: 0,
      confidence: 1.0,
      categories: [],
      targetType: 'none',
      targetCategory: null,
      isThreat: false,
      isDehumanizing: false,
      isQuotedContent: false,
      isCondemnation: false,
      recommendedAction: 'allow',
      reason: 'Comment text is empty or too short for safety evaluation.',
      evidence: [],
      model: 'deterministic_precheck',
      modelVersion: '1.0',
      analyzedAt: new Date(),
    };
  }

  const contentHash = hashCommentText(text);

  // Check cache unless forceFresh is requested
  if (!forceFresh && moderationCache.has(contentHash)) {
    const cached = moderationCache.get(contentHash);
    return {
      ...cached,
      cached: true,
      contentHash,
    };
  }

  const apiKey =
    process.env.GROQ_API_KEY ||
    process.env.AI_API_KEY ||
    process.env.OPENAI_API_KEY ||
    process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return {
      ...createFallbackReport('AI API key is not configured. Falling back to human review.'),
      model: 'fallback',
      contentHash,
    };
  }

  const isGroq =
    Boolean(process.env.GROQ_API_KEY) ||
    (typeof apiKey === 'string' && apiKey.startsWith('gsk_'));

  const baseUrl =
    process.env.AI_BASE_URL ||
    (isGroq ? 'https://api.groq.com/openai/v1' : 'https://api.openai.com/v1');

  const preferredModel =
    process.env.AI_MODEL || (isGroq ? 'openai/gpt-oss-120b' : 'gpt-4o-mini');
  const fallbackModel = isGroq ? 'openai/gpt-oss-20b' : 'gpt-4o-mini';

  const messages = buildModerationPrompt(text, { articleTitle, parentCommentText });
  const endpoint = `${baseUrl.replace(/\/$/, '')}/chat/completions`;

  async function attemptModerationCall(modelToUse) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8-second safety timeout

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: modelToUse,
          messages,
          temperature: 0.1, // Low temperature for deterministic classification
          max_tokens: 600,
          response_format: { type: 'json_object' },
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorJson = await response.json().catch(() => ({}));
        const err = new Error(errorJson.error?.message || `HTTP ${response.status}`);
        err.status = response.status;
        throw err;
      }

      const data = await response.json();
      const rawContent = data.choices?.[0]?.message?.content || '';

      // Strip any markdown code fence wrappers or thinking blocks
      let cleanJsonStr = rawContent.replace(/```json\s*/gi, '').replace(/```\s*$/gi, '').trim();
      if (cleanJsonStr.includes('<think>')) {
        cleanJsonStr = cleanJsonStr.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
      }

      const parsed = JSON.parse(cleanJsonStr);
      const validated = validateModerationOutput(parsed, text);

      return {
        ...validated,
        model: modelToUse,
        modelVersion: '1.0',
        contentHash,
        cached: false,
      };
    } catch (err) {
      clearTimeout(timeoutId);
      throw err;
    }
  }

  try {
    const result = await attemptModerationCall(preferredModel);
    // Cache successful evaluation
    if (moderationCache.size >= MAX_CACHE_ENTRIES) {
      const firstKey = moderationCache.keys().next().value;
      moderationCache.delete(firstKey);
    }
    moderationCache.set(contentHash, result);
    return result;
  } catch (err) {
    // If rate limit (429), pause briefly and attempt fallback model
    if (err.status === 429) {
      await new Promise((r) => setTimeout(r, 500));
      try {
        const altModel = fallbackModel !== preferredModel ? fallbackModel : 'llama-3.1-8b-instant';
        const fallbackResult = await attemptModerationCall(altModel);
        moderationCache.set(contentHash, fallbackResult);
        return fallbackResult;
      } catch (fallbackErr) {
        return {
          ...createFallbackReport(`AI moderation fallback error: ${fallbackErr.message}`),
          model: 'fallback',
          contentHash,
        };
      }
    }

    return {
      ...createFallbackReport(`AI moderation error: ${err.message}`),
      model: 'fallback',
      contentHash,
    };
  }
}
