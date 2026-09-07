import crypto from 'crypto';
import Comment from '../models/comment.model.js';
import Post from '../models/post.model.js';
import Taxonomy from '../models/taxonomy.model.js';
import { analyzeCommentContent } from '../ai/moderation.service.js';

const MODERATION_ROLES = new Set(['editor', 'admin', 'superadmin']);

function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function hashIp(ip) {
  if (!ip) return 'anonymous';
  return crypto.createHash('sha256').update(ip + 'techy_salt_2026').digest('hex').slice(0, 16);
}

function sanitizeCommentText(text) {
  if (!text) return '';
  return text
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<[^>]+>/g, '') // Strip all HTML tags for plain comment safety
    .trim()
    .slice(0, 3000);
}

function evaluateSpamSignals(text, name) {
  let score = 0;
  const reasons = [];

  // Check URL density
  const urlMatches = text.match(/https?:\/\/[^\s]+/gi) || [];
  if (urlMatches.length >= 3) {
    score += 40;
    reasons.push('High URL density (3+ links)');
  }

  // Check spammy keywords
  const spamKeywords = [
    'viagra', 'casino', 'free crypto', 'investment scheme', 'whatsapp number',
    'earn money fast', 'telegram channel', 'hackers for hire', 'seo backlinks',
  ];
  const lowerText = text.toLowerCase();
  for (const kw of spamKeywords) {
    if (lowerText.includes(kw)) {
      score += 50;
      reasons.push(`Contains spam phrase: "${kw}"`);
    }
  }

  // Check repetitive text patterns
  if (/(\b\w+\b)(?:\s+\1){4,}/i.test(text)) {
    score += 30;
    reasons.push('Repetitive words/phrases detected');
  }

  return { score: Math.min(score, 100), reasons };
}

function evaluateDeterministicAbuseSignals(text) {
  const lower = text.toLowerCase();
  
  // Protect quoted content with explicit condemnation from false positive threat flagging
  const hasQuotes = /["'“‘][^"'“”’]{3,}["'”’]/.test(text);
  const hasCondemnation = /\b(unacceptable|horrific|terrible|wrong|condemn|condemning|disgusting|awful|evil|bad|reprehensible|criminal|lie|lies|abhorrent|heinous|hate)\b/i.test(lower);
  if (hasQuotes && hasCondemnation) {
    return { isSuspicious: false };
  }

  const criticalThreatPatterns = [
    /\bkill\s+(you|all|them|him|her)\b/i,
    /\bbeat\s+(you|them|him)\s+to\s+death\b/i,
    /\bwhere\s+you\s+live\b/i,
    /\b(subhuman|terrorist|terrorists)\b/i,
    /\bworthless\s+idiot\b/i,
    /\bgo\s+kill\s+yourself\b/i,
  ];

  for (const pattern of criticalThreatPatterns) {
    if (pattern.test(lower)) {
      return { isSuspicious: true };
    }
  }
  return { isSuspicious: false };
}

class CommentService {
  /**
   * Public Comment Creation with strict post verification, spam check & AI safety intelligence
   */
  async createComment(commentData, actor = null, rawIp = '') {
    const { slug, name, text, email, parentId } = commentData;
    const resolvedName = (actor && actor.name) ? actor.name : name;
    if (!slug || !resolvedName || !text) {
      throw new Error('Slug, name, and comment text are required');
    }

    const cleanName = String(resolvedName).trim().slice(0, 100);
    const cleanText = sanitizeCommentText(text);
    if (!cleanText || cleanText.length < 2) {
      throw new Error('Comment text must contain at least 2 characters of valid text');
    }

    // Verify post exists and is publicly published (publishedAt <= now)
    const now = new Date();
    const post = await Post.findOne({
      slug,
      status: { $in: ['published', 'updated'] },
      publishedAt: { $lte: now },
    }).select('_id title slug author primaryAuthor status publishedAt').lean();

    if (!post) {
      throw new Error('Comments can only be submitted to published, publicly accessible articles');
    }

    const ipHash = hashIp(rawIp);

    // Anti-flood duplicate check: Prevent same IP submitting identical comment to same post within 60s
    const recentDuplicate = await Comment.findOne({
      slug,
      ipHash,
      text: cleanText,
      createdAt: { $gte: new Date(now.getTime() - 60000) },
    }).lean();

    if (recentDuplicate) {
      throw new Error('Duplicate comment submission detected. Please wait a moment.');
    }

    // Evaluate spam heuristics
    const { score: spamScore, reasons: spamReasons } = evaluateSpamSignals(cleanText, cleanName);

    // Parent context if replying to a comment
    let parentCommentText = '';
    if (parentId) {
      const parentDoc = await Comment.findById(parentId).select('text').lean();
      if (parentDoc) parentCommentText = parentDoc.text;
    }

    // Run AI Safety Intelligence Analysis (Graceful Degradation if AI unavailable)
    let aiModerationReport = null;
    try {
      aiModerationReport = await analyzeCommentContent({
        text: cleanText,
        articleTitle: post.title,
        parentCommentText,
      });
    } catch (err) {
      aiModerationReport = {
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
        reason: `AI analysis error: ${err.message}`,
        evidence: [],
        analyzedAt: new Date(),
      };
    }

    // Check if actor is an authenticated editorial staff / author
    const isStaff = actor && MODERATION_ROLES.has(actor.role);
    const isArticleAuthor = actor && (String(post.primaryAuthor || '') === String(actor._id || '') || post.author === actor.name);

    let status = 'pending';
    let isEditorial = false;
    let editorialBadge = '';
    let autoApproved = false;
    let approvedAt = null;

    if (isArticleAuthor) {
      status = 'approved';
      isEditorial = true;
      editorialBadge = 'Author';
      approvedAt = new Date();
    } else if (isStaff) {
      status = 'approved';
      isEditorial = true;
      editorialBadge = actor.role === 'superadmin' ? 'Editor-in-Chief' : 'Editor';
      approvedAt = new Date();
    } else if (spamScore >= 80) {
      status = 'spam';
    } else if (aiModerationReport && aiModerationReport.status === 'completed') {
      const { classification, severity, isThreat, isDehumanizing, recommendedAction, isQuotedContent, isCondemnation } = aiModerationReport;

      // Category 1 & Category 2: Safe discussion, constructive/political/religious debate, or minor impoliteness
      const isClearlySafe = (
        recommendedAction === 'allow' ||
        (classification === 'safe' && severity <= 1 && !isThreat && !isDehumanizing) ||
        (isQuotedContent && isCondemnation)
      );

      if (isClearlySafe) {
        status = 'approved';
        autoApproved = true;
        approvedAt = new Date();
      } else {
        // Category 3, 4 & 5: Ambiguous, targeted harassment, identity hatred, or severe threats
        status = 'pending';
      }
    } else {
      // AI Unavailable / Timeout Fallback:
      // If deterministic spam checks pass (<50) and no blatant threat keywords, publish immediately
      const hasAbuseSignals = evaluateDeterministicAbuseSignals(cleanText).isSuspicious;
      if (spamScore < 50 && !hasAbuseSignals) {
        status = 'approved';
        autoApproved = true;
        approvedAt = new Date();
      } else {
        status = 'pending';
      }
    }

    const comment = await Comment.create({
      slug,
      post: post._id,
      parent: parentId || null,
      name: cleanName,
      email: email ? String(email).trim().slice(0, 150) : '',
      text: cleanText,
      author: actor ? actor._id : null,
      user: actor ? actor._id : null,
      avatar: actor?.avatar || '',
      isEditorial,
      editorialBadge,
      status,
      autoApproved,
      approvedAt,
      spamScore,
      spamReasons,
      aiModeration: aiModerationReport,
      ipHash,
    });

    return {
      _id: comment._id,
      name: comment.name,
      avatar: comment.avatar,
      text: comment.text,
      status: comment.status,
      autoApproved: comment.autoApproved,
      isEditorial: comment.isEditorial,
      editorialBadge: comment.editorialBadge,
      author: comment.author,
      user: comment.user,
      likesCount: comment.likesCount || 0,
      dislikesCount: comment.dislikesCount || 0,
      createdAt: comment.createdAt,
      message:
        status === 'approved'
          ? 'Comment posted!'
          : status === 'spam'
          ? 'Your comment is undergoing review.'
          : 'Your comment has been submitted for editorial review.',
    };
  }

  /**
   * Public: Get approved comments for an article
   */
  async getCommentsBySlug(slug) {
    const rawComments = await Comment.find({
      slug,
      status: 'approved',
      isDeleted: { $ne: true },
    })
      .select('name text avatar isEditorial editorialBadge isPinned parent author user likes likesCount dislikes dislikesCount status isDeleted createdAt timestamp')
      .sort({ isPinned: -1, timestamp: 1 })
      .lean();

    const safeComments = rawComments.map((c) => ({
      _id: c._id,
      name: c.name,
      avatar: c.avatar || '',
      text: c.text,
      parent: c.parent,
      author: c.author || c.user || null,
      user: c.user || c.author || null,
      isEditorial: c.isEditorial || false,
      editorialBadge: c.editorialBadge || '',
      isPinned: c.isPinned || false,
      likesCount: c.likesCount || (c.likes ? c.likes.length : 0),
      dislikesCount: c.dislikesCount || (c.dislikes ? c.dislikes.length : 0),
      likes: (c.likes || []).map((id) => id.toString()),
      dislikes: (c.dislikes || []).map((id) => id.toString()),
      status: c.status,
      isDeleted: false,
      createdAt: c.createdAt,
      timestamp: c.timestamp,
    }));

    return safeComments;
  }

  /**
   * Helper: Retrieve all recursive descendant comment IDs for cascade deletion
   */
  async getAllDescendantIds(commentId) {
    const descendantIds = [];
    const queue = [commentId];

    while (queue.length > 0) {
      const currentId = queue.shift();
      const children = await Comment.find({ parent: currentId }).select('_id').lean();
      for (const child of children) {
        descendantIds.push(child._id);
        queue.push(child._id);
      }
    }
    return descendantIds;
  }

  /**
   * Authenticated: Like or Dislike a comment with rate-limit and deduplication
   */
  async reactToComment(commentId, reactionType, user) {
    if (!user || !user._id) {
      throw new Error('Authentication required to react to comments');
    }
    if (!['like', 'dislike'].includes(reactionType)) {
      throw new Error('Invalid reaction type. Must be "like" or "dislike"');
    }

    const comment = await Comment.findById(commentId);
    if (!comment || comment.status === 'deleted' || comment.isDeleted) {
      throw new Error('Comment not found');
    }

    const userIdStr = user._id.toString();
    comment.likes = comment.likes || [];
    comment.dislikes = comment.dislikes || [];

    const hasLiked = comment.likes.some((id) => id.toString() === userIdStr);
    const hasDisliked = comment.dislikes.some((id) => id.toString() === userIdStr);

    let userReaction = null;

    if (reactionType === 'like') {
      if (hasLiked) {
        // Toggle off like
        comment.likes = comment.likes.filter((id) => id.toString() !== userIdStr);
        userReaction = null;
      } else {
        // Add like, remove dislike if present
        comment.likes.push(user._id);
        comment.dislikes = comment.dislikes.filter((id) => id.toString() !== userIdStr);
        userReaction = 'like';
      }
    } else if (reactionType === 'dislike') {
      if (hasDisliked) {
        // Toggle off dislike
        comment.dislikes = comment.dislikes.filter((id) => id.toString() !== userIdStr);
        userReaction = null;
      } else {
        // Add dislike, remove like if present
        comment.dislikes.push(user._id);
        comment.likes = comment.likes.filter((id) => id.toString() !== userIdStr);
        userReaction = 'dislike';
      }
    }

    comment.likesCount = comment.likes.length;
    comment.dislikesCount = comment.dislikes.length;
    await comment.save();

    return {
      success: true,
      likesCount: comment.likesCount,
      dislikesCount: comment.dislikesCount,
      userReaction,
    };
  }

  /**
   * Delete own comment or editorial deletion with cascade removal of all replies
   */
  async deleteComment(commentId, user = null, rawIp = '') {
    const comment = await Comment.findById(commentId);
    if (!comment) {
      throw new Error('Comment not found');
    }

    const userIdStr = String(user?._id || user?.id || '');
    const currentUserName = String(user?.name || '').toLowerCase().trim();
    const commentAuthorId = String(comment.author || comment.user || '');
    const commentName = String(comment.name || '').toLowerCase().trim();
    const role = String(user?.role || '').toLowerCase().trim();

    const isStaff = ['editor', 'admin', 'superadmin', 'editor in chief', 'chief editor'].includes(role);
    const isOwner =
      (Boolean(userIdStr && commentAuthorId) && commentAuthorId === userIdStr) ||
      (Boolean(currentUserName && commentName) && currentUserName === commentName) ||
      (Boolean(rawIp && comment.ipHash) && comment.ipHash === hashIp(rawIp));

    if (!isOwner && !isStaff) {
      throw new Error('Not authorized to delete this comment');
    }

    // Cascade delete: find all recursive child replies
    const descendantIds = await this.getAllDescendantIds(commentId);
    const allTargetIds = [comment._id, ...descendantIds];

    // Mark parent and all replies in the subtree as deleted
    await Comment.updateMany(
      { _id: { $in: allTargetIds } },
      {
        $set: {
          status: 'deleted',
          isDeleted: true,
          text: '[Comment deleted by author]',
        },
      }
    );

    if (isStaff && user) {
      comment.moderationHistory.push({
        action: 'deleted',
        moderator: {
          id: String(user._id || user.id || ''),
          name: user.name || 'Moderator',
          role: user.role || 'editor',
        },
        timestamp: new Date(),
        previousStatus: comment.status,
        newStatus: 'deleted',
        note: isOwner ? 'Deleted by author with cascade deletion of replies' : 'Deleted by moderator with cascade deletion of replies',
        moderatorOverride: false,
      });
      await comment.save();
    }

    return {
      success: true,
      message: 'Comment and all replies deleted successfully',
      deletedCount: allTargetIds.length,
      deletedIds: allTargetIds.map((id) => id.toString()),
    };
  }

  /**
   * Public: Report an abusive comment with rate-limit deduplication
   */
  async reportComment(commentId, { reason, rawIp }) {
    if (!reason || !reason.trim()) throw new Error('Report reason is required');

    const comment = await Comment.findById(commentId);
    if (!comment) throw new Error('Comment not found');

    const reporterHash = hashIp(rawIp);

    // Prevent duplicate report from same source
    const existingReport = comment.reports.find((r) => r.reporterHash === reporterHash);
    if (existingReport) {
      throw new Error('You have already reported this comment. Our moderation team has been notified.');
    }

    comment.reports.push({
      reason: String(reason).trim().slice(0, 200),
      reporterHash,
      createdAt: new Date(),
    });
    comment.reportCount = comment.reports.length;

    await comment.save();

    return {
      success: true,
      message: 'Thank you for your report. Our editorial team will review this comment.',
    };
  }

  /**
   * Admin: Get Live Moderation Metrics with AI Triage Signals
   */
  async getModerationMetrics() {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const [
      pendingCount,
      reportedCount,
      spamCount,
      approvedToday,
      rejectedToday,
      totalComments,
      activeDiscussions,
      aiNeedsAttentionCount,
      aiSevereCount,
      autoApprovedTotal,
      overridesTotal,
      totalAnalyzed,
    ] = await Promise.all([
      Comment.countDocuments({ status: 'pending' }),
      Comment.countDocuments({ reportCount: { $gt: 0 }, status: { $ne: 'deleted' } }),
      Comment.countDocuments({ status: 'spam' }),
      Comment.countDocuments({ status: 'approved', updatedAt: { $gte: startOfDay, $lte: endOfDay } }),
      Comment.countDocuments({ status: 'rejected', updatedAt: { $gte: startOfDay, $lte: endOfDay } }),
      Comment.countDocuments({ status: { $ne: 'deleted' } }),
      Comment.distinct('slug', { status: 'approved' }),
      Comment.countDocuments({
        'aiModeration.classification': { $in: ['abusive', 'severe', 'review'] },
        status: { $in: ['pending', 'reported'] },
      }),
      Comment.countDocuments({
        'aiModeration.classification': 'severe',
        status: { $ne: 'deleted' },
      }),
      Comment.countDocuments({ autoApproved: true }),
      Comment.countDocuments({ 'moderationHistory.moderatorOverride': true }),
      Comment.countDocuments({ 'aiModeration.status': 'completed' }),
    ]);

    const autoApprovedRate = totalAnalyzed > 0 ? Math.round((autoApprovedTotal / totalAnalyzed) * 1000) / 10 : 100;

    return {
      stats: {
        pendingCount,
        reportedCount,
        spamCount,
        approvedToday,
        rejectedToday,
        totalComments,
        activeDiscussionsCount: activeDiscussions.length,
        aiNeedsAttentionCount,
        aiSevereCount,
        autoApprovedTotal,
        totalAnalyzed,
        autoApprovedRate,
        overridesTotal,
      },
      timestamp: now.toISOString(),
    };
  }

  /**
   * Admin: Get Moderation Queue (Bounded & Filtered with AI Triage)
   */
  async getModerationQueue(filters = {}) {
    const { status, desk, search, sort = 'needs_attention', aiFilter, page = 1, limit = 25 } = filters;
    const query = {};

    if (status && status !== 'all') {
      if (status === 'reported') {
        query.reportCount = { $gt: 0 };
        query.status = { $ne: 'deleted' };
      } else if (status === 'ai_review') {
        query['aiModeration.classification'] = { $in: ['abusive', 'severe', 'review'] };
        query.status = { $ne: 'deleted' };
      } else if (status === 'ai_severe') {
        query['aiModeration.classification'] = 'severe';
        query.status = { $ne: 'deleted' };
      } else {
        query.status = status;
      }
    }

    if (aiFilter && aiFilter !== 'all') {
      query['aiModeration.classification'] = aiFilter;
    }

    if (desk && desk !== 'all') {
      const deskDoc = await Taxonomy.findOne({ kind: 'section', slug: desk }).lean();
      if (deskDoc) {
        const postIds = await Post.find({
          $or: [{ primarySection: deskDoc._id }, { categories: deskDoc.name }],
        }).distinct('_id');
        query.post = { $in: postIds };
      }
    }

    if (search && search.trim()) {
      const safeSearch = escapeRegex(search.trim().slice(0, 100));
      query.$or = [
        { text: { $regex: safeSearch, $options: 'i' } },
        { name: { $regex: safeSearch, $options: 'i' } },
        { slug: { $regex: safeSearch, $options: 'i' } },
      ];
    }

    let sortOption = { createdAt: -1 };
    if (sort === 'needs_attention') {
      sortOption = { 'aiModeration.severity': -1, reportCount: -1, spamScore: -1, createdAt: -1 };
    } else if (sort === 'ai_severity') {
      sortOption = { 'aiModeration.severity': -1, 'aiModeration.confidence': -1, createdAt: -1 };
    } else if (sort === 'reported') {
      sortOption = { reportCount: -1, createdAt: -1 };
    } else if (sort === 'oldest') {
      sortOption = { createdAt: 1 };
    } else if (sort === 'newest') {
      sortOption = { createdAt: -1 };
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(Math.max(1, parseInt(limit, 10) || 25), 100);
    const skip = (pageNum - 1) * limitNum;

    const [comments, total] = await Promise.all([
      Comment.find(query)
        .populate('post', 'title slug primarySection categories image status')
        .populate('parent', 'name text')
        .sort(sortOption)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Comment.countDocuments(query),
    ]);

    return {
      comments,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    };
  }

  /**
   * Admin: Moderate Single Comment with Full Audit History & Override Tracking
   */
  async moderateComment(commentId, action, user, note = '') {
    if (!MODERATION_ROLES.has(user?.role)) {
      throw new Error('Editorial authorization required to moderate comments');
    }

    const comment = await Comment.findById(commentId);
    if (!comment) throw new Error('Comment not found');

    const previousStatus = comment.status;
    let newStatus = previousStatus;

    if (['approved', 'rejected', 'spam', 'deleted', 'pending'].includes(action)) {
      newStatus = action;
      comment.status = newStatus;
    } else if (action === 'pin') {
      comment.isPinned = true;
    } else if (action === 'unpin') {
      comment.isPinned = false;
    } else {
      throw new Error(`Invalid moderation action: ${action}`);
    }

    if (note) {
      comment.moderatorNotes = String(note).slice(0, 2000);
    }

    // Determine if human decision overrides AI recommendation
    const aiRec = comment.aiModeration?.recommendedAction || 'allow';
    let isOverride = false;
    if (newStatus === 'approved' && (aiRec === 'review' || aiRec === 'hold')) {
      isOverride = true;
    } else if ((newStatus === 'rejected' || newStatus === 'spam' || newStatus === 'deleted') && aiRec === 'allow') {
      isOverride = true;
    }

    comment.moderationHistory.push({
      action,
      moderator: {
        id: String(user?._id || ''),
        name: user?.name || 'Moderator',
        role: user?.role || 'editor',
      },
      timestamp: new Date(),
      previousStatus,
      newStatus,
      note: note ? String(note).slice(0, 500) : '',
      aiRecommendation: aiRec,
      aiConfidence: comment.aiModeration?.confidence || 0,
      moderatorOverride: isOverride,
    });

    await comment.save();

    return {
      success: true,
      message: `Comment marked as ${action}`,
      comment: await Comment.findById(commentId).populate('post', 'title slug').lean(),
    };
  }

  /**
   * Admin: Re-analyze comment on-demand with fresh AI call
   */
  async reanalyzeComment(commentId, user) {
    if (!MODERATION_ROLES.has(user?.role)) {
      throw new Error('Editorial authorization required to trigger AI moderation analysis');
    }

    const comment = await Comment.findById(commentId).populate('post', 'title');
    if (!comment) throw new Error('Comment not found');

    const freshReport = await analyzeCommentContent({
      text: comment.text,
      articleTitle: comment.post?.title || '',
      forceFresh: true,
    });

    comment.aiModeration = freshReport;
    await comment.save();

    return {
      success: true,
      message: 'AI safety analysis completed successfully',
      aiModeration: comment.aiModeration,
      comment: await Comment.findById(commentId).populate('post', 'title slug').lean(),
    };
  }

  /**
   * Admin: Bulk Moderate Comments (Batched with per-item validation)
   */
  async bulkModerate(commentIds = [], action, user) {
    if (!MODERATION_ROLES.has(user?.role)) {
      throw new Error('Editorial authorization required for bulk moderation');
    }

    if (!Array.isArray(commentIds) || commentIds.length === 0) {
      throw new Error('No comment IDs provided for bulk action');
    }

    const maxBatch = commentIds.slice(0, 100);
    const results = {
      processed: 0,
      failed: 0,
      errors: [],
    };

    for (const id of maxBatch) {
      try {
        await this.moderateComment(id, action, user, `Bulk action: ${action}`);
        results.processed += 1;
      } catch (err) {
        results.failed += 1;
        results.errors.push({ id, error: err.message });
      }
    }

    return {
      success: results.failed === 0,
      message: `Bulk moderation completed: ${results.processed} processed, ${results.failed} failed`,
      results,
    };
  }

  /**
   * Admin: Get Full Thread Context for a comment
   */
  async getThreadContext(commentId) {
    const target = await Comment.findById(commentId)
      .populate('post', 'title slug primarySection')
      .lean();

    if (!target) throw new Error('Comment not found');

    // Retrieve full thread for this post
    const threadComments = await Comment.find({
      post: target.post?._id || target.post,
      slug: target.slug,
    })
      .populate('author', 'name role title')
      .sort({ createdAt: 1 })
      .lean();

    return {
      target,
      thread: threadComments,
    };
  }
}

export const commentService = new CommentService();
export default commentService;
