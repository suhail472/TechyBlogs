/**
 * TeachyBlogs AI — Comment Moderation Output Validator & Normalizer
 * Validates, bounds, and normalizes structured JSON output from LLM moderation providers.
 */

const ALLOWED_CLASSIFICATIONS = new Set(['safe', 'review', 'abusive', 'severe', 'unclassified']);
const ALLOWED_TARGET_TYPES = new Set(['none', 'individual', 'protected_group', 'institution', 'idea_doctrine']);
const ALLOWED_ACTIONS = new Set(['allow', 'review', 'hold']);

export function validateModerationOutput(rawOutput, commentText = '') {
  if (!rawOutput || typeof rawOutput !== 'object') {
    return createFallbackReport('Invalid non-object AI moderation output');
  }

  // 1. Classification
  let classification = String(rawOutput.classification || 'review').toLowerCase().trim();
  if (!ALLOWED_CLASSIFICATIONS.has(classification)) {
    classification = 'review';
  }

  // 2. Severity (0 to 5)
  let severity = parseInt(rawOutput.severity, 10);
  if (isNaN(severity) || severity < 0) severity = 0;
  if (severity > 5) severity = 5;

  // 3. Confidence (0.0 to 1.0)
  let confidence = parseFloat(rawOutput.confidence);
  if (isNaN(confidence) || confidence < 0) confidence = 0.5;
  if (confidence > 1) confidence = 1.0;
  confidence = Math.round(confidence * 100) / 100;

  // 4. Target Type & Category
  let targetType = String(rawOutput.targetType || 'none').toLowerCase().trim();
  if (!ALLOWED_TARGET_TYPES.has(targetType)) targetType = 'none';

  let targetCategory = rawOutput.targetCategory ? String(rawOutput.targetCategory).trim().slice(0, 100) : null;

  // 5. Flags
  const isThreat = Boolean(rawOutput.isThreat);
  const isDehumanizing = Boolean(rawOutput.isDehumanizing);

  const textLower = String(commentText).toLowerCase();
  const textHasQuotes = /["'“‘][^"'“”’]{3,}["'”’]/.test(commentText);
  const textHasCondemnation = /\b(unacceptable|horrific|terrible|wrong|condemn|condemning|disgusting|awful|evil|bad|hatred)\b/i.test(textLower);

  const isQuotedContent = Boolean(rawOutput.isQuotedContent) || textHasQuotes;
  const isCondemnation = Boolean(rawOutput.isCondemnation) || (textHasQuotes && textHasCondemnation);

  // 6. Categories Array
  const categories = Array.isArray(rawOutput.categories)
    ? rawOutput.categories
        .filter((c) => typeof c === 'string' && c.trim())
        .map((c) => c.trim().slice(0, 50))
        .slice(0, 8)
    : [];

  // 7. Recommended Action
  let recommendedAction = String(rawOutput.recommendedAction || '').toLowerCase().trim();
  if (!ALLOWED_ACTIONS.has(recommendedAction)) {
    if (severity >= 4 || isThreat) recommendedAction = 'hold';
    else if (severity >= 2 || classification === 'review' || classification === 'abusive') recommendedAction = 'review';
    else recommendedAction = 'allow';
  }

  // Policy safety override: Sensitive categories with low confidence MUST route to human review
  if (targetType === 'protected_group' && confidence < 0.85 && classification === 'abusive') {
    classification = 'review';
    recommendedAction = 'review';
  }

  // Quotation & Condemnation safety override: If comment quotes hate speech to condemn it, do not classify as abusive or hold
  if (isQuotedContent && isCondemnation) {
    classification = 'safe';
    severity = 0;
    recommendedAction = 'allow';
  }

  // 8. Reason & Evidence
  const reason = String(rawOutput.reason || 'AI moderation analysis completed.').trim().slice(0, 1000);
  const evidence = Array.isArray(rawOutput.evidence)
    ? rawOutput.evidence
        .filter((e) => typeof e === 'string' && e.trim())
        .map((e) => e.trim().slice(0, 200))
        .slice(0, 5)
    : [];

  return {
    status: 'completed',
    classification,
    severity,
    confidence,
    categories,
    targetType,
    targetCategory,
    isThreat,
    isDehumanizing,
    isQuotedContent,
    isCondemnation,
    recommendedAction,
    reason,
    evidence,
    analyzedAt: new Date(),
  };
}

export function createFallbackReport(reason = 'AI moderation provider unavailable') {
  return {
    status: 'failed',
    classification: 'unclassified',
    severity: 0,
    confidence: 0,
    categories: [],
    targetType: 'none',
    targetCategory: null,
    isThreat: false,
    isDehumanizing: false,
    isQuotedContent: false,
    isCondemnation: false,
    recommendedAction: 'review',
    reason: String(reason).slice(0, 500),
    evidence: [],
    analyzedAt: new Date(),
  };
}
