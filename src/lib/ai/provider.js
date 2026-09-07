import { buildPromptPayload } from './prompts.js';

/**
 * TechyBlogs AI — Provider Abstraction & Streaming Engine
 * High-performance streaming with automatic model failover (120B -> 20B)
 * to prevent TPM throttling while maintaining world-class reasoning.
 */
export async function* streamEditorialResponse({
  userMessage,
  articleContext,
  history = [],
  signal = null,
}) {
  const apiKey =
    process.env.GROQ_API_KEY ||
    process.env.AI_API_KEY ||
    process.env.OPENAI_API_KEY ||
    process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('AI Provider API key is not configured. Please set GROQ_API_KEY or AI_API_KEY in .env.local.');
  }

  const isGroq =
    Boolean(process.env.GROQ_API_KEY) ||
    (typeof apiKey === 'string' && apiKey.startsWith('gsk_'));

  const baseUrl =
    process.env.AI_BASE_URL ||
    (isGroq
      ? 'https://api.groq.com/openai/v1'
      : process.env.OPENAI_API_KEY
      ? 'https://api.openai.com/v1'
      : 'https://api.groq.com/openai/v1');

  const preferredModel =
    process.env.AI_MODEL ||
    (isGroq ? 'openai/gpt-oss-120b' : 'gpt-4o-mini');

  const fallbackModel = isGroq ? 'openai/gpt-oss-20b' : 'gpt-4o-mini';

  // Construct structured messages payload containing system prompt, public article data, and conversation history
  const messages = buildPromptPayload(articleContext, userMessage, history);
  const endpoint = `${baseUrl.replace(/\/$/, '')}/chat/completions`;

  // Function to attempt streaming from a given model
  async function* attemptStream(modelToUse) {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: modelToUse,
        messages,
        temperature: 0.3,
        max_tokens: 1000,
        stream: true,
      }),
      signal,
    });

    if (!response.ok) {
      let errorDetail = '';
      try {
        const errorJson = await response.json();
        errorDetail = errorJson.error?.message || response.statusText;
      } catch (e) {
        errorDetail = `HTTP ${response.status}`;
      }
      const err = new Error(`AI Provider error (${response.status}): ${errorDetail}`);
      err.status = response.status;
      throw err;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    let insideThinkingTag = false;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed === 'data: [DONE]') continue;
        if (trimmed.startsWith('data: ')) {
          try {
            const parsed = JSON.parse(trimmed.slice(6));
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              // Clean any thinking blocks from model output
              let cleanDelta = delta;
              if (cleanDelta.includes('<think>')) {
                insideThinkingTag = true;
                cleanDelta = cleanDelta.split('<think>')[0];
              }
              if (insideThinkingTag) {
                if (cleanDelta.includes('</think>')) {
                  insideThinkingTag = false;
                  cleanDelta = cleanDelta.split('</think>')[1] || '';
                } else {
                  continue;
                }
              }

              if (cleanDelta) {
                yield cleanDelta;
              }
            }
          } catch (e) {
            // ignore partial json chunk parse errors
          }
        }
      }
    }
  }

  // Attempt stream with preferred model, failover to fast model if TPM/429 encountered
  try {
    yield* attemptStream(preferredModel);
  } catch (err) {
    if (signal?.aborted) return;

    if (err.status === 429 && preferredModel !== fallbackModel) {
      console.warn(`Preferred model (${preferredModel}) hit TPM limit. Failing over to ${fallbackModel}...`);
      yield* attemptStream(fallbackModel);
    } else {
      throw err;
    }
  }
}
