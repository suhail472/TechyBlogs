import Post from '../models/post.model.js';
import Admin from '../models/admin.model.js';
import Taxonomy from '../models/taxonomy.model.js';
import { validatePublicationIntegrity, canEditPost, serialiseActor } from './editorial.service.js';

const EDITORIAL_ROLES = new Set(['editor', 'admin', 'superadmin']);

function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

class CalendarService {
  /**
   * Get high-level newsroom calendar metrics
   */
  async getCalendarMetrics() {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const [
      publishedToday,
      scheduledToday,
      overdueCount,
      dueSoonCount,
      inReviewCount,
      unassignedCount,
      embargoedCount,
      thisWeekPublications,
    ] = await Promise.all([
      Post.countDocuments({
        status: { $in: ['published', 'updated'] },
        publishedAt: { $gte: startOfDay, $lte: endOfDay },
      }),
      Post.countDocuments({
        status: 'scheduled',
        scheduledAt: { $gte: now, $lte: endOfDay },
      }),
      Post.countDocuments({
        deadline: { $lt: now },
        status: { $nin: ['published', 'archived', 'updated'] },
      }),
      Post.countDocuments({
        deadline: { $gte: now, $lte: in24Hours },
        status: { $nin: ['published', 'archived', 'updated'] },
      }),
      Post.countDocuments({ status: 'in_review' }),
      Post.countDocuments({
        $or: [{ primaryAuthor: null }, { primarySection: null }],
        status: { $nin: ['published', 'archived'] },
      }),
      Post.countDocuments({
        embargoAt: { $gt: now },
      }),
      Post.countDocuments({
        status: { $in: ['published', 'updated'] },
        publishedAt: { $gte: startOfWeek },
      }),
    ]);

    return {
      stats: {
        publishedToday,
        scheduledToday,
        overdueCount,
        dueSoonCount,
        inReviewCount,
        unassignedCount,
        embargoedCount,
        thisWeekPublications,
      },
      timestamp: now.toISOString(),
    };
  }

  /**
   * Get calendar story feed with multi-dimensional filtering, ReDoS protection, and bounded pagination
   */
  async getCalendarFeed(params = {}) {
    const { start, end, desk, bureau, author, status, priority, search, limit } = params;
    const query = {};

    // 1. Date Range Filter
    if (start && end) {
      const startDate = new Date(start);
      const endDate = new Date(end);
      if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
        query.$or = [
          { scheduledAt: { $gte: startDate, $lte: endDate } },
          { publishedAt: { $gte: startDate, $lte: endDate } },
          { deadline: { $gte: startDate, $lte: endDate } },
          { createdAt: { $gte: startDate, $lte: endDate } },
        ];
      }
    }

    // 2. Filters
    if (status && status !== 'all') query.status = status;
    if (priority && priority !== 'all') query.priority = priority;

    if (desk && desk !== 'all') {
      const deskDoc = await Taxonomy.findOne({ kind: 'section', slug: desk }).lean();
      if (deskDoc) {
        query.$or = [
          { primarySection: deskDoc._id },
          { sections: deskDoc._id },
          { categories: deskDoc.name },
        ];
      }
    }

    if (bureau && bureau !== 'all') {
      const bureauDoc = await Taxonomy.findOne({ kind: 'region', slug: bureau }).lean();
      if (bureauDoc) {
        query.$or = [
          { primaryRegion: bureauDoc._id },
          { regions: bureauDoc._id },
        ];
      }
    }

    if (author && author !== 'all') {
      const authorDoc = await Admin.findOne({ $or: [{ slug: author }, { username: author }] }).lean();
      if (authorDoc) {
        query.$or = [
          { primaryAuthor: authorDoc._id },
          { author: authorDoc.name },
        ];
      }
    }

    // ReDoS-safe sanitized search
    if (search && search.trim()) {
      const safeSearch = escapeRegex(search.trim().slice(0, 100));
      query.$or = [
        { title: { $regex: safeSearch, $options: 'i' } },
        { slug: { $regex: safeSearch, $options: 'i' } },
        { author: { $regex: safeSearch, $options: 'i' } },
      ];
    }

    const maxLimit = Math.min(parseInt(limit, 10) || 250, 500);

    const posts = await Post.find(query)
      .select(
        'title slug status contentType publishedAt scheduledAt deadline embargoAt priority author primaryAuthor primarySection primaryRegion image excerpt editorial editorialHistory editorialNotes views likes'
      )
      .populate('primaryAuthor', 'name slug avatar title role')
      .populate('primarySection', 'name slug')
      .populate('primaryRegion', 'name slug isHub')
      .sort({ scheduledAt: 1, deadline: 1, publishedAt: -1 })
      .limit(maxLimit)
      .lean();

    const conflicts = this.detectConflicts(posts);

    return {
      posts,
      conflicts,
      count: posts.length,
    };
  }

  /**
   * Schedule Story with strict publication gate check, editorial authorization, and audit logging
   */
  async scheduleStory(postId, payload, user) {
    if (!EDITORIAL_ROLES.has(user?.role)) {
      throw new Error('Editorial authorization required to schedule stories for publication');
    }

    const post = await Post.findById(postId);
    if (!post) throw new Error('Story not found');

    const { scheduledAt, timezone, embargoAt, deadline, priority } = payload;
    if (!scheduledAt) {
      throw new Error('Scheduled date and time are required');
    }

    const scheduledDate = new Date(scheduledAt);
    if (isNaN(scheduledDate.getTime())) {
      throw new Error('Invalid scheduled date/time format');
    }

    if (scheduledDate <= new Date()) {
      throw new Error('Scheduled time must be in the future. To publish now, use the Publish action.');
    }

    if (embargoAt) {
      const embargoDate = new Date(embargoAt);
      if (isNaN(embargoDate.getTime())) {
        throw new Error('Invalid embargo date format');
      }
      if (embargoDate > scheduledDate) {
        throw new Error('Embargo date cannot be set after the scheduled publication time');
      }
    }

    // Strict publication gate verification
    const validation = validatePublicationIntegrity(post);
    if (!validation.isValid) {
      throw new Error(`Cannot schedule story due to publication gate requirements: ${validation.issues.join('; ')}`);
    }

    const previousStatus = post.status;
    const previousSchedule = post.scheduledAt;

    post.status = 'scheduled';
    post.scheduledAt = scheduledDate;
    if (timezone) post.publishedTimezone = String(timezone).slice(0, 50);
    if (embargoAt) post.embargoAt = new Date(embargoAt);
    if (deadline) post.deadline = new Date(deadline);
    if (priority && ['low', 'normal', 'high', 'urgent'].includes(priority)) post.priority = priority;

    post.editorialHistory.push({
      action: 'scheduled',
      actor: serialiseActor(user),
      timestamp: new Date(),
      note: `Story scheduled for publication at ${scheduledDate.toISOString()}${
        previousSchedule ? ` (Previously: ${new Date(previousSchedule).toISOString()})` : ''
      }`,
      previousStatus,
    });

    await post.save();

    return {
      success: true,
      message: `Story "${post.title}" successfully scheduled for publication at ${scheduledDate.toLocaleString()}`,
      post: await Post.findById(postId).populate('primaryAuthor primarySection primaryRegion').lean(),
    };
  }

  /**
   * Reschedule Story with authorization and audit logging
   */
  async rescheduleStory(postId, newScheduledAt, user) {
    if (!EDITORIAL_ROLES.has(user?.role)) {
      throw new Error('Editorial authorization required to reschedule stories');
    }

    const post = await Post.findById(postId);
    if (!post) throw new Error('Story not found');

    const scheduledDate = new Date(newScheduledAt);
    if (isNaN(scheduledDate.getTime())) {
      throw new Error('Invalid new scheduled date/time format');
    }

    if (scheduledDate <= new Date()) {
      throw new Error('New scheduled time must be in the future.');
    }

    const previousSchedule = post.scheduledAt;
    post.scheduledAt = scheduledDate;

    post.editorialHistory.push({
      action: 'rescheduled',
      actor: serialiseActor(user),
      timestamp: new Date(),
      note: `Rescheduled from ${previousSchedule ? new Date(previousSchedule).toISOString() : 'None'} to ${scheduledDate.toISOString()}`,
    });

    await post.save();

    return {
      success: true,
      message: `Story "${post.title}" rescheduled to ${scheduledDate.toLocaleString()}`,
      post: await Post.findById(postId).populate('primaryAuthor primarySection primaryRegion').lean(),
    };
  }

  /**
   * Update Planning Metadata (deadline, priority, notes)
   */
  async updatePlanning(postId, payload, user) {
    const post = await Post.findById(postId);
    if (!post) throw new Error('Story not found');

    if (!canEditPost(post, user)) {
      throw new Error('Unauthorized to update planning for this story');
    }

    if (payload.deadline !== undefined) post.deadline = payload.deadline ? new Date(payload.deadline) : null;
    if (payload.embargoAt !== undefined) post.embargoAt = payload.embargoAt ? new Date(payload.embargoAt) : null;
    if (payload.priority && ['low', 'normal', 'high', 'urgent'].includes(payload.priority)) {
      post.priority = payload.priority;
    }
    if (payload.editorialNotes !== undefined) post.editorialNotes = String(payload.editorialNotes).slice(0, 2000);

    await post.save();

    return {
      success: true,
      message: 'Editorial planning details updated',
      post: await Post.findById(postId).populate('primaryAuthor primarySection primaryRegion').lean(),
    };
  }

  /**
   * Detect overlapping author deadlines and desk congestion
   */
  detectConflicts(posts = []) {
    const conflicts = [];
    const authorScheduleMap = new Map();
    const deskTimeMap = new Map();

    posts.forEach((post) => {
      // 1. Author simultaneous scheduling check
      if (post.primaryAuthor?._id && post.scheduledAt) {
        const timeKey = `${post.primaryAuthor._id}_${new Date(post.scheduledAt).toISOString().slice(0, 13)}`;
        if (authorScheduleMap.has(timeKey)) {
          conflicts.push({
            type: 'author_overload',
            severity: 'warning',
            authorName: post.primaryAuthor.name,
            message: `Author "${post.primaryAuthor.name}" has multiple stories scheduled within the same hour.`,
            postId: post._id,
          });
        } else {
          authorScheduleMap.set(timeKey, post._id);
        }
      }

      // 2. Desk congestion check
      if (post.primarySection?._id && post.scheduledAt) {
        const deskKey = `${post.primarySection._id}_${new Date(post.scheduledAt).toISOString().slice(0, 13)}`;
        const currentCount = deskTimeMap.get(deskKey) || 0;
        if (currentCount >= 3) {
          conflicts.push({
            type: 'desk_congestion',
            severity: 'info',
            deskName: post.primarySection.name,
            message: `Desk "${post.primarySection.name}" has 3+ stories scheduled for release within the same hour window.`,
            postId: post._id,
          });
        }
        deskTimeMap.set(deskKey, currentCount + 1);
      }
    });

    return conflicts;
  }
}

export const calendarService = new CalendarService();
export default calendarService;
