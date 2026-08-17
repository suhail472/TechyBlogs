import Admin from '../models/admin.model.js';
import Post from '../models/post.model.js';

class AuthorService {
  /**
   * Get Roster Overview Metrics
   */
  async getRosterOverview() {
    const [totalAuthors, activeCount, bureauChiefsCount, columnistsCount, bylinesAggregation, bureauDistribution] =
      await Promise.all([
        Admin.countDocuments({}),
        Admin.countDocuments({ status: 'active', isActive: true }),
        Admin.countDocuments({ editorialRole: 'bureau_chief' }),
        Admin.countDocuments({ editorialRole: 'columnist' }),
        Post.aggregate([
          { $match: { status: 'published' } },
          {
            $group: {
              _id: null,
              totalBylines: { $sum: 1 },
              totalViews: { $sum: '$views' },
            },
          },
        ]),
        Admin.aggregate([
          { $match: { isActive: true } },
          {
            $group: {
              _id: { $ifNull: ['$bureau', 'Global Newsroom'] },
              count: { $sum: 1 },
            },
          },
          { $sort: { count: -1 } },
        ]),
      ]);

    return {
      stats: {
        totalAuthors,
        activeStaff: activeCount,
        bureauChiefs: bureauChiefsCount,
        columnists: columnistsCount,
        totalBylines: bylinesAggregation[0]?.totalBylines || 0,
        totalViews: bylinesAggregation[0]?.totalViews || 0,
      },
      bureauDistribution: bureauDistribution.map((b) => ({
        bureau: b._id,
        count: b.count,
      })),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get all authors with multi-dimensional filtering and live post statistics
   */
  async getAllAuthors(filters = {}) {
    const { bureau, status, role, desk, search } = filters;
    const query = {};

    if (bureau && bureau !== 'all') query.bureau = bureau;
    if (status && status !== 'all') query.status = status;
    if (role && role !== 'all') query.role = role;
    if (desk && desk !== 'all') query.primaryDesk = desk;
    if (search && search.trim()) {
      const q = search.trim();
      query.$or = [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
        { title: { $regex: q, $options: 'i' } },
        { slug: { $regex: q, $options: 'i' } },
      ];
    }

    const authors = await Admin.find(query)
      .select('-password')
      .sort({ order: 1, name: 1 })
      .lean();

    // Populate live article counts and latest story for each author
    const authorsWithMetrics = await Promise.all(
      authors.map(async (author) => {
        const [publishedCount, draftsCount, viewsAgg, latestPost] = await Promise.all([
          Post.countDocuments({
            $or: [{ primaryAuthor: author._id }, { author: author.name }],
            status: 'published',
          }),
          Post.countDocuments({
            $or: [{ primaryAuthor: author._id }, { author: author.name }],
            status: 'draft',
          }),
          Post.aggregate([
            {
              $match: {
                $or: [{ primaryAuthor: author._id }, { author: author.name }],
                status: 'published',
              },
            },
            {
              $group: {
                _id: null,
                totalViews: { $sum: '$views' },
              },
            },
          ]),
          Post.findOne({
            $or: [{ primaryAuthor: author._id }, { author: author.name }],
            status: 'published',
          })
            .sort({ publishedAt: -1 })
            .select('title slug publishedAt')
            .lean(),
        ]);

        return {
          ...author,
          postCount: publishedCount,
          draftCount: draftsCount,
          totalViews: viewsAgg[0]?.totalViews || 0,
          latestPost: latestPost || null,
        };
      })
    );

    return authorsWithMetrics;
  }

  /**
   * Create New Author
   */
  async createAuthor(data, user) {
    if (!['admin', 'superadmin'].includes(user?.role)) {
      throw new Error('Admin permission required to create author profiles');
    }

    const cleanSlug =
      data.slug ||
      String(data.name || '')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

    const existingSlug = await Admin.findOne({ slug: cleanSlug });
    if (existingSlug) {
      throw new Error(`An author profile with slug "/author/${cleanSlug}" already exists`);
    }

    const existingEmail = await Admin.findOne({ email: data.email.toLowerCase().trim() });
    if (existingEmail) {
      throw new Error(`An account with email "${data.email}" already exists`);
    }

    const author = await Admin.create({
      ...data,
      email: data.email.toLowerCase().trim(),
      slug: cleanSlug,
      password: data.password || 'TeachyBlogs2026!',
      role: data.role || 'author',
      status: data.status || 'active',
      title: data.title || 'Staff Correspondent',
      bureau: data.bureau || 'Global Newsroom',
      primaryDesk: data.primaryDesk || 'Technology',
      verified: data.verified ?? true,
    });

    const sanitized = author.toObject();
    delete sanitized.password;
    return sanitized;
  }

  /**
   * Update Author
   */
  async updateAuthor(id, data, user) {
    const isSelf = String(user?._id) === String(id);
    const isAdmin = ['admin', 'superadmin'].includes(user?.role);

    if (!isSelf && !isAdmin) {
      throw new Error('Unauthorized to update this author profile');
    }

    const body = { ...data };
    delete body.password; // Passwords are updated through auth password route

    if (body.role && !isAdmin) {
      delete body.role; // Non-admins cannot elevate their own role
    }

    if (body.name && !body.slug) {
      body.slug = String(body.name)
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    }

    const author = await Admin.findByIdAndUpdate(id, body, { new: true, runValidators: true }).select('-password');
    if (!author) {
      throw new Error('Author profile not found');
    }

    return author;
  }

  /**
   * Safe Delete or Deactivate Author
   */
  async safeDeleteOrDeactivate(id, user) {
    if (!['admin', 'superadmin'].includes(user?.role)) {
      throw new Error('Admin permission required to manage author status');
    }

    const author = await Admin.findById(id);
    if (!author) throw new Error('Author profile not found');

    const publishedCount = await Post.countDocuments({
      $or: [{ primaryAuthor: author._id }, { author: author.name }],
      status: 'published',
    });

    if (publishedCount > 0) {
      // Deactivate / mark former to preserve historical article bylines
      author.status = 'former';
      author.isActive = false;
      await author.save();
      return {
        success: true,
        action: 'deactivated',
        message: `Author has ${publishedCount} published stories. Profile was safely archived as "Former Staff" to preserve public byline links.`,
      };
    }

    // Direct delete if 0 published stories exist
    await Admin.findByIdAndDelete(id);
    return {
      success: true,
      action: 'deleted',
      message: `Author "${author.name}" was safely removed from the roster.`,
    };
  }
}

export const authorService = new AuthorService();
export default authorService;
