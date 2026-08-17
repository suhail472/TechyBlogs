import crypto from 'crypto';
import Comment from '../models/comment.model.js';
import Post from '../models/post.model.js';
import Taxonomy from '../models/taxonomy.model.js';

const MODERATION_ROLES = new Set(['editor', 'admin', 'superadmin']);

function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function hashIp(ip) {
  if (!ip) return 'anonymous';
  return crypto.createHash('sha256').update(ip + 'teachy_salt_2026').digest('hex').slice(0, 16);
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

class CommentService {
  /**
   * Public Comment Creation with strict post verification & sanitization
   */
  async createComment(commentData, actor = null, rawIp = '') {
    const { slug, name, text, email, parentId } = commentData;
    if (!slug || !name || !text) {
      throw new Error('Slug, name, and comment text are required');
    }

    const cleanName = String(name).trim().slice(0, 100);
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

    // Check if actor is an authenticated editorial staff / author
    const isStaff = actor && MODERATION_ROLES.has(actor.role);
    const isArticleAuthor = actor && (String(post.primaryAuthor || '') === String(actor._id || '') || post.author === actor.name);

    let status = 'pending';
    let isEditorial = false;
    let editorialBadge = '';

    if (isArticleAuthor) {
      status = 'approved';
      isEditorial = true;
      editorialBadge = 'Author';
    } else if (isStaff) {
      status = 'approved';
      isEditorial = true;
      editorialBadge = actor.role === 'superadmin' ? 'Editor-in-Chief' : 'Editor';
    } else if (spamScore >= 80) {
      status = 'spam';
    }

    const comment = await Comment.create({
      slug,
      post: post._id,
      parent: parentId || null,
      name: cleanName,
      email: email ? String(email).trim().slice(0, 150) : '',
      text: cleanText,
      author: actor ? actor._id : null,
      isEditorial,
      editorialBadge,
      status,
      spamScore,
      spamReasons,
      ipHash,
    });

    return {
      _id: comment._id,
      name: comment.name,
      text: comment.text,
      status: comment.status,
      isEditorial: comment.isEditorial,
      editorialBadge: comment.editorialBadge,
      createdAt: comment.createdAt,
      message: status === 'approved' ? 'Comment published' : 'Comment submitted for editorial review',
    };
  }

  /**
   * Public: Get approved comments for an article (stripped of sensitive metadata)
   */
  async getCommentsBySlug(slug) {
    const rawComments = await Comment.find({
      slug,
      status: 'approved',
    })
      .select('name text avatar isEditorial editorialBadge isPinned parent createdAt timestamp')
      .sort({ isPinned: -1, timestamp: 1 })
      .lean();

    return rawComments;
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
   * Admin: Get Live Moderation Metrics
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
    ] = await Promise.all([
      Comment.countDocuments({ status: 'pending' }),
      Comment.countDocuments({ reportCount: { $gt: 0 }, status: { $ne: 'deleted' } }),
      Comment.countDocuments({ status: 'spam' }),
      Comment.countDocuments({ status: 'approved', updatedAt: { $gte: startOfDay, $lte: endOfDay } }),
      Comment.countDocuments({ status: 'rejected', updatedAt: { $gte: startOfDay, $lte: endOfDay } }),
      Comment.countDocuments({ status: { $ne: 'deleted' } }),
      Comment.distinct('slug', { status: 'approved' }),
    ]);

    return {
      stats: {
        pendingCount,
        reportedCount,
        spamCount,
        approvedToday,
        rejectedToday,
        totalComments,
        activeDiscussionsCount: activeDiscussions.length,
      },
      timestamp: now.toISOString(),
    };
  }

  /**
   * Admin: Get Moderation Queue (Bounded & Filtered)
   */
  async getModerationQueue(filters = {}) {
    const { status, desk, search, sort = 'needs_attention', page = 1, limit = 25 } = filters;
    const query = {};

    if (status && status !== 'all') {
      if (status === 'reported') {
        query.reportCount = { $gt: 0 };
        query.status = { $ne: 'deleted' };
      } else {
        query.status = status;
      }
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
      sortOption = { reportCount: -1, spamScore: -1, createdAt: -1 };
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
   * Admin: Moderate Single Comment with Audit History
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
    });

    await comment.save();

    return {
      success: true,
      message: `Comment marked as ${action}`,
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
