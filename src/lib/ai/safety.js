/**
 * TechyBlogs AI — Safety & Prompt Injection Defense
 * Sanitizes input, enforces bounds, and protects system instructions from adversarial tampering.
 */

const MAX_USER_MESSAGE_LENGTH = 600;
const MAX_CONVERSATION_TURNS = 12;

// Patterns indicating potential prompt injection or system override attempts
const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior|above)\s+instructions/i,
  /disregard\s+(all\s+)?(previous|prior|above)\s+instructions/i,
  /you\s+are\s+now\s+(a|an|in)\s+/i,
  /reveal\s+(the\s+)?(system\s+prompt|developer\s+instructions|api\s+key)/i,
  /output\s+(the\s+)?(system\s+prompt|initial\s+prompt)/i,
  /bypass\s+(all\s+)?safety/i,
  /system:\s*$/im,
  /<\/?system>/i,
  /\[SYSTEM_INSTRUCTION\]/i,
  /\bADMIN_SECRET\b/i,
  /\bMONGODB_URI\b/i,
];

/**
 * Sanitize and validate incoming user message
 */
export function sanitizeUserMessage(rawMessage) {
  if (typeof rawMessage !== 'string') {
    return { isValid: false, sanitized: '', error: 'Message must be a text string.' };
  }

  const trimmed = rawMessage.trim();

  if (!trimmed) {
    return { isValid: false, sanitized: '', error: 'Message cannot be empty.' };
  }

  if (trimmed.length > MAX_USER_MESSAGE_LENGTH) {
    return {
      isValid: false,
      sanitized: '',
      error: `Message exceeds maximum length of ${MAX_USER_MESSAGE_LENGTH} characters.`,
    };
  }

  // Remove potential dangerous control characters and null bytes
  const sanitized = trimmed
    .replace(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F\u007F-\u009F]/g, '')
    .slice(0, MAX_USER_MESSAGE_LENGTH);

  // Check injection risk flag
  const hasInjectionAttempt = INJECTION_PATTERNS.some((pattern) => pattern.test(sanitized));

  return {
    isValid: true,
    sanitized,
    hasInjectionAttempt,
  };
}

/**
 * Sanitize and bound conversation history
 */
export function sanitizeHistory(history) {
  if (!Array.isArray(history)) return [];

  return history
    .slice(-MAX_CONVERSATION_TURNS)
    .filter((item) => item && (item.role === 'user' || item.role === 'assistant') && typeof item.content === 'string')
    .map((item) => ({
      role: item.role,
      content: item.content
        .replace(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F\u007F-\u009F]/g, '')
        .trim()
        .slice(0, MAX_USER_MESSAGE_LENGTH),
    }));
}

/**
 * Strip potential injection markers from retrieved article content before injection
 */
export function sanitizeArticleText(text, maxChars = 8000) {
  if (!text || typeof text !== 'string') return '';

  return text
    .replace(/```[\s\S]*?```/g, (codeBlock) => {
      // Keep code blocks clean but bounded
      return codeBlock.slice(0, 1500);
    })
    .replace(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F\u007F-\u009F]/g, '')
    .trim()
    .slice(0, maxChars);
}
