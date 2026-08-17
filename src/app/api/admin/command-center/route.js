import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { verifyAuth } from '@/lib/middlewares/auth';
import Post from '@/lib/models/post.model';
import Comment from '@/lib/models/comment.model';
import Subscriber from '@/lib/models/subscriber.model';
import Taxonomy from '@/lib/models/taxonomy.model';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    await connectToDatabase();
    const user = await verifyAuth(req);

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    const next24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // Parallel aggregate queries for maximum performance
    const [
      publishedTodayCount,
      scheduledTodayCount,
      inReviewCount,
      draftsCount,
      breakingCount,
      pendingCommentsCount,
      totalSubscribersCount,
      totalViewsAggregation,
      urgentStories,
      inReviewArticles,
      missingSeoArticles,
      missingAuthorArticles,
      scheduledUpcomingArticles,
      todayTimelineArticles,
      nextScheduledStory,
      topStories,
      deskMetricsAggregation,
      bureauMetricsAggregation,
      recentActivityArticles,
    ] = await Promise.all([
      // 1. Published today count
      Post.countDocuments({
        status: 'published',
        publishedAt: { $gte: startOfDay, $lte: endOfDay },
      }),
      // 2. Scheduled today count
      Post.countDocuments({
        status: 'scheduled',
        scheduledAt: { $gte: startOfDay, $lte: endOfDay },
      }),
      // 3. In review count
      Post.countDocuments({ status: 'in_review' }),
      // 4. Drafts count
      Post.countDocuments({ status: 'draft' }),
      // 5. Breaking & developing count
      Post.countDocuments({
        $or: [
          { 'editorial.breaking': true },
          { breaking: true },
          { 'editorial.developing': true },
          { developing: true },
        ],
      }),
      // 6. Pending comments count
      Comment.countDocuments({ status: 'pending' }),
      // 7. Active subscribers count
      Subscriber.countDocuments({ active: true }),
      // 8. Total views sum
      Post.aggregate([
        {
          $group: {
            _id: null,
            totalViews: { $sum: '$views' },
          },
        },
      ]),
      // 9. Urgent / Live stories (Breaking or Developing)
      Post.find({
        $or: [
          { 'editorial.breaking': true },
          { breaking: true },
          { 'editorial.developing': true },
          { developing: true },
        ],
      })
        .sort({ updatedAt: -1 })
        .limit(6)
        .select('title slug subtitle excerpt author primarySection categories image status editorial breaking developing publishedAt updatedAt')
        .lean(),
      // 10. In Review articles (Actionable queue)
      Post.find({ status: 'in_review' })
        .sort({ updatedAt: -1 })
        .limit(5)
        .select('title slug author primarySection categories updatedAt')
        .lean(),
      // 11. Missing SEO description (Actionable queue)
      Post.find({
        status: { $ne: 'archived' },
        $and: [
          { 'seo.description': { $in: ['', null] } },
          { metaDescription: { $in: ['', null] } },
          { subtitle: { $in: ['', null] } },
        ],
      })
        .sort({ updatedAt: -1 })
        .limit(5)
        .select('title slug author status primarySection categories updatedAt')
        .lean(),
      // 12. Missing author (Actionable queue)
      Post.find({
        status: { $ne: 'archived' },
        author: { $in: ['', null] },
      })
        .sort({ updatedAt: -1 })
        .limit(5)
        .select('title slug status primarySection categories updatedAt')
        .lean(),
      // 13. Scheduled upcoming within 24h (Actionable queue)
      Post.find({
        status: 'scheduled',
        scheduledAt: { $gte: now, $lte: next24h },
      })
        .sort({ scheduledAt: 1 })
        .limit(5)
        .select('title slug author primarySection scheduledAt')
        .lean(),
      // 14. Today's Publishing Timeline (Published + Scheduled)
      Post.find({
        $or: [
          { status: 'published', publishedAt: { $gte: startOfDay, $lte: endOfDay } },
          { status: 'scheduled', scheduledAt: { $gte: startOfDay, $lte: endOfDay } },
        ],
      })
        .sort({ publishedAt: -1, scheduledAt: 1 })
        .limit(10)
        .select('title slug author status publishedAt scheduledAt primarySection categories')
        .lean(),
      // 15. Next upcoming scheduled article
      Post.findOne({
        status: 'scheduled',
        scheduledAt: { $gte: now },
      })
        .sort({ scheduledAt: 1 })
        .select('title slug author primarySection categories scheduledAt image')
        .lean(),
      // 16. Top performing stories by pageviews
      Post.find({ status: 'published' })
        .sort({ views: -1 })
        .limit(5)
        .select('title slug views likes author primarySection categories image publishedAt')
        .lean(),
      // 17. Desk distribution breakdown
      Post.aggregate([
        { $match: { status: { $ne: 'archived' } } },
        {
          $group: {
            _id: { $ifNull: ['$primarySection', { $arrayElemAt: ['$categories', 0] }] },
            count: { $sum: 1 },
            totalViews: { $sum: '$views' },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 6 },
      ]),
      // 18. Regional bureau breakdown
      Post.aggregate([
        { $match: { status: { $ne: 'archived' } } },
        {
          $group: {
            _id: { $ifNull: ['$primaryRegion', 'Global Bureau'] },
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 4 },
      ]),
      // 19. Recent editorial activity events
      Post.find({ 'editorialHistory.0': { $exists: true } })
        .sort({ updatedAt: -1 })
        .limit(10)
        .select('title slug editorialHistory updatedAt')
        .lean(),
    ]);

    // Compile actionable Needs Attention items
    const needsAttention = [];

    inReviewArticles.forEach((p) => {
      needsAttention.push({
        id: `review_${p._id}`,
        postId: p._id,
        slug: p.slug,
        title: p.title,
        reason: 'Awaiting editorial review and publishing approval',
        type: 'review',
        priority: 'high',
        section: p.primarySection || p.categories?.[0] || 'General',
        author: p.author || 'Editorial Bureau',
        timestamp: p.updatedAt,
      });
    });

    scheduledUpcomingArticles.forEach((p) => {
      needsAttention.push({
        id: `sched_${p._id}`,
        postId: p._id,
        slug: p.slug,
        title: p.title,
        reason: `Scheduled release approaching at ${new Date(p.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
        type: 'scheduled_soon',
        priority: 'medium',
        section: p.primarySection || 'General',
        author: p.author || 'Editorial Bureau',
        timestamp: p.scheduledAt,
      });
    });

    missingAuthorArticles.forEach((p) => {
      needsAttention.push({
        id: `no_auth_${p._id}`,
        postId: p._id,
        slug: p.slug,
        title: p.title,
        reason: 'Missing author byline assignment',
        type: 'missing_metadata',
        priority: 'medium',
        section: p.primarySection || 'General',
        author: 'Unassigned',
        timestamp: p.updatedAt,
      });
    });

    missingSeoArticles.forEach((p) => {
      needsAttention.push({
        id: `no_seo_${p._id}`,
        postId: p._id,
        slug: p.slug,
        title: p.title,
        reason: 'Missing search meta description',
        type: 'missing_seo',
        priority: 'low',
        section: p.primarySection || 'General',
        author: p.author || 'Editorial Bureau',
        timestamp: p.updatedAt,
      });
    });

    // Extract recent chronological activities
    const recentActivity = [];
    recentActivityArticles.forEach((post) => {
      (post.editorialHistory || []).forEach((hist) => {
        recentActivity.push({
          id: `${post._id}_${hist.at ? new Date(hist.at).getTime() : Date.now()}`,
          postId: post._id,
          postTitle: post.title,
          postSlug: post.slug,
          action: hist.action,
          actor: hist.by?.name || 'Editor',
          role: hist.by?.role || 'Staff',
          summary: hist.summary || hist.note || '',
          timestamp: hist.at || post.updatedAt,
        });
      });
    });
    recentActivity.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return NextResponse.json(
      {
        success: true,
        pulse: {
          publishedToday: publishedTodayCount,
          scheduledToday: scheduledTodayCount,
          inReview: inReviewCount,
          drafts: draftsCount,
          breakingCount,
          pendingComments: pendingCommentsCount,
          totalSubscribers: totalSubscribersCount,
          totalViews: totalViewsAggregation[0]?.totalViews || 0,
        },
        urgentStories,
        needsAttention: needsAttention.slice(0, 8),
        publishingTimeline: todayTimelineArticles,
        nextScheduled: nextScheduledStory,
        topStories,
        deskMetrics: deskMetricsAggregation.map((d) => ({
          desk: String(d._id || 'General'),
          count: d.count,
          views: d.totalViews || 0,
        })),
        bureauMetrics: bureauMetricsAggregation.map((b) => ({
          bureau: String(b._id || 'Global'),
          count: b.count,
        })),
        recentActivity: recentActivity.slice(0, 8),
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching newsroom command center data:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}
