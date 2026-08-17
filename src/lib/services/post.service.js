import Post from '../models/post.model.js';
import Taxonomy from '../models/taxonomy.model.js';

function escapeRegex(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

class PostService {
  /**
   * Create a new Post document
   */
  async createPost(postData) {
    const { title, slug, excerpt, content, image, tags, categories, author, contentType, primaryTopic, primaryRegion, language } = postData;
    const cleanSlug = String(slug || title).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const existingPost = await Post.findOne({ slug: cleanSlug });
    if (existingPost) throw new Error('A post with this slug already exists');

    return await Post.create({
      title,
      slug: cleanSlug,
      excerpt,
      content,
      image,
      contentType: contentType || 'article',
      primaryTopic: primaryTopic || null,
      topics: primaryTopic ? [primaryTopic] : [],
      primaryRegion: primaryRegion || null,
      regions: primaryRegion ? [primaryRegion] : [],
      tags: tags || [],
      categories: categories || ['Technology'],
      author: author || 'Suheel Hilal',
      language: language || 'en',
      status: 'published',
      publishedAt: new Date(),
    });
  }

  /**
   * Get all posts with multi-dimensional filtering, pagination, and public security projections
   */
  async getAllPosts(filters = {}) {
    const {
      status = 'published',
      category,
      tag,
      topic,
      region,
      contentType,
      language,
      series,
      coverage,
      featured,
      breaking,
      search,
      author,
      page = 1,
      limit = 10,
      sortBy = 'publishedAt',
      sortOrder = 'desc',
    } = filters;

    const now = new Date();
    const query = status === 'all' ? {} : { status, publishedAt: { $lte: now } };

    if (category && category !== 'All') {
      query.categories = category;
    }
    if (tag) {
      query.tags = tag;
    }
    if (contentType && contentType !== 'all') {
      query.contentType = contentType;
    }
    if (language && language !== 'all') {
      query.language = language;
    }
    if (featured === true || featured === 'true') {
      query.featured = true;
    }
    if (breaking === true || breaking === 'true') {
      query['editorial.breaking'] = true;
    }

    // Filter by Topic (matches primaryTopic or secondary topics or taxonomy slug)
    if (topic && topic !== 'all') {
      let topicDoc = null;
      if (typeof topic === 'string' && topic.length !== 24) {
        topicDoc = await Taxonomy.findOne({ kind: 'topic', slug: topic }).select('_id').lean();
      }
      const topicId = topicDoc ? topicDoc._id : topic;
      query.$or = [{ primaryTopic: topicId }, { topics: topicId }];
    }

    // Filter by Region (matches primaryRegion or secondary regions or taxonomy slug)
    if (region && region !== 'all') {
      let regionDoc = null;
      if (typeof region === 'string' && region.length !== 24) {
        regionDoc = await Taxonomy.findOne({ kind: 'region', slug: region }).select('_id').lean();
      }
      const regionId = regionDoc ? regionDoc._id : region;
      if (query.$or) {
        query.$and = [
          { $or: query.$or },
          { $or: [{ primaryRegion: regionId }, { regions: regionId }] },
        ];
        delete query.$or;
      } else {
        query.$or = [{ primaryRegion: regionId }, { regions: regionId }];
      }
    }

    if (series) query.series = series;
    if (coverage) query.coverage = coverage;
    if (author) query.author = new RegExp(escapeRegex(author), 'i');

    if (search) {
      const q = escapeRegex(search.trim());
      const searchOr = [
        { title: { $regex: q, $options: 'i' } },
        { excerpt: { $regex: q, $options: 'i' } },
        { tags: { $regex: q, $options: 'i' } },
        { author: { $regex: q, $options: 'i' } },
      ];
      if (query.$and) {
        query.$and.push({ $or: searchOr });
      } else if (query.$or) {
        query.$and = [{ $or: query.$or }, { $or: searchOr }];
        delete query.$or;
      } else {
        query.$or = searchOr;
      }
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const [posts, total] = await Promise.all([
      Post.find(query)
        .select('-revisions -editorialHistory')
        .populate('primaryTopic', 'name slug kind parent')
        .populate('primaryRegion', 'name slug kind isHub type')
        .populate('series', 'name slug title')
        .populate('coverage', 'name slug title')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit, 10))
        .lean(),
      Post.countDocuments(query),
    ]);

    return {
      posts,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total,
        pages: Math.ceil(total / parseInt(limit, 10)) || 1,
      },
    };
  }

  /**
   * Get single post by slug (public view: excludes internal revisions & audit logs)
   */
  async getPostBySlug(slug) {
    const cleanSlug = String(slug).toLowerCase().trim();
    const post = await Post.findOne({
      slug: cleanSlug,
      status: 'published',
      publishedAt: { $lte: new Date() },
    })
      .select('-revisions -editorialHistory')
      .populate('primaryTopic', 'name slug kind description seo parent ancestors')
      .populate('primaryRegion', 'name slug kind description isHub type ancestors')
      .populate('topics', 'name slug')
      .populate('regions', 'name slug')
      .populate('entities', 'name slug type')
      .populate('series', 'name slug title description')
      .populate('coverage', 'name slug title description');

    if (!post) throw new Error('Post not found');
    post.views = (post.views || 0) + 1;
    await post.save();
    return post;
  }

  /**
   * Get post by ID (internal admin/editor view)
   */
  async getPostById(postId) {
    const post = await Post.findById(postId)
      .populate('primaryTopic', 'name slug')
      .populate('primaryRegion', 'name slug')
      .populate('topics', 'name slug')
      .populate('regions', 'name slug')
      .populate('entities', 'name slug')
      .populate('series', 'name slug')
      .populate('coverage', 'name slug');

    if (!post) throw new Error('Post not found');
    return post;
  }

  /**
   * Update post with slug collision verification
   */
  async updatePost(postId, updateData) {
    const post = await Post.findById(postId);
    if (!post) throw new Error('Post not found');
    if (updateData.slug && updateData.slug !== post.slug) {
      const cleanSlug = String(updateData.slug).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const existingPost = await Post.findOne({ slug: cleanSlug, _id: { $ne: postId } });
      if (existingPost) throw new Error('A post with this slug already exists');
      updateData.slug = cleanSlug;
    }
    Object.assign(post, updateData);
    await post.save();
    return post;
  }

  /**
   * Delete post by ID
   */
  async deletePost(postId) {
    const post = await Post.findById(postId);
    if (!post) throw new Error('Post not found');
    await post.deleteOne();
    return { message: 'Post deleted successfully' };
  }

  /**
   * Get Regional Hub editorial feed (e.g. Kashmir / Srinagar / India hub)
   */
  async getRegionalHubPosts(regionSlug, limit = 12) {
    const regionDoc = await Taxonomy.findOne({ kind: 'region', slug: regionSlug, active: true }).lean();
    if (!regionDoc) return { region: null, posts: [], sections: {} };

    const regionIds = [regionDoc._id];
    // Find all descendant sub-regions
    const subRegions = await Taxonomy.find({ 'ancestors._id': regionDoc._id }).select('_id').lean();
    subRegions.forEach((sr) => regionIds.push(sr._id));

    const now = new Date();
    const posts = await Post.find({
      status: 'published',
      publishedAt: { $lte: now },
      $or: [{ primaryRegion: { $in: regionIds } }, { regions: { $in: regionIds } }],
    })
      .select('-revisions -editorialHistory')
      .populate('primaryTopic', 'name slug')
      .populate('primaryRegion', 'name slug')
      .sort({ publishedAt: -1 })
      .limit(limit)
      .lean();

    return {
      region: regionDoc,
      posts,
      total: posts.length,
    };
  }

  /**
   * Get related posts based on topic and region
   */
  async getRelatedPosts(currentPostId, primaryTopicId, primaryRegionId, limit = 4) {
    const query = {
      _id: { $ne: currentPostId },
      status: 'published',
      publishedAt: { $lte: new Date() },
    };

    if (primaryTopicId && primaryRegionId) {
      query.$or = [{ primaryTopic: primaryTopicId }, { primaryRegion: primaryRegionId }];
    } else if (primaryTopicId) {
      query.primaryTopic = primaryTopicId;
    } else if (primaryRegionId) {
      query.primaryRegion = primaryRegionId;
    }

    return await Post.find(query)
      .select('-revisions -editorialHistory')
      .populate('primaryTopic', 'name slug')
      .populate('primaryRegion', 'name slug')
      .sort({ publishedAt: -1 })
      .limit(limit)
      .lean();
  }
}

const postService = new PostService();
export default postService;