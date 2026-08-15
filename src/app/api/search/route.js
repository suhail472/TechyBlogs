import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Post from '@/lib/models/post.model';
import Taxonomy from '@/lib/models/taxonomy.model';
import Admin from '@/lib/models/admin.model';

export async function GET(req) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get('q') || '').trim();
    const section = searchParams.get('section');
    const edition = searchParams.get('edition');
    const contentType = searchParams.get('contentType');
    const tag = searchParams.get('tag');
    const author = searchParams.get('author');
    const sortBy = searchParams.get('sortBy') || 'relevance';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '12', 10);

    const query = { status: 'published' };

    if (q) {
      const regex = new RegExp(q.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), 'i');
      query.$or = [
        { title: regex },
        { excerpt: regex },
        { tags: regex },
        { categories: regex },
        { author: regex },
      ];
    }

    if (section) {
      const secDoc = await Taxonomy.findOne({ slug: section, kind: 'section' });
      if (secDoc) {
        query.$or = [{ primarySection: secDoc._id }, { sections: secDoc._id }, { categories: secDoc.name }];
      } else {
        query.categories = new RegExp(section, 'i');
      }
    }

    if (edition) {
      const edDoc = await Taxonomy.findOne({ slug: edition, kind: 'edition' });
      if (edDoc) {
        query.editions = edDoc._id;
      }
    }

    if (contentType && contentType !== 'all') {
      query.contentType = contentType;
    }

    if (tag) {
      query.tags = tag;
    }

    if (author) {
      query.author = new RegExp(author, 'i');
    }

    let sort = { publishedAt: -1 };
    if (sortBy === 'oldest') sort = { publishedAt: 1 };
    if (sortBy === 'popular') sort = { views: -1, likes: -1 };
    if (sortBy === 'trending') sort = { trendingScore: -1, publishedAt: -1 };

    const skip = (page - 1) * limit;

    const [posts, total] = await Promise.all([
      Post.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('primarySection', 'name slug')
        .populate('editions', 'name slug')
        .populate('primaryAuthor', 'name slug avatar')
        .lean(),
      Post.countDocuments(query),
    ]);

    // Facet counts for filters
    const availableSections = await Taxonomy.find({ kind: 'section', active: true }).select('name slug').lean();
    const availableEditions = await Taxonomy.find({ kind: 'edition', active: true }).select('name slug').lean();

    return NextResponse.json({
      success: true,
      data: {
        posts: JSON.parse(JSON.stringify(posts)),
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
        facets: {
          sections: availableSections,
          editions: availableEditions,
          contentTypes: ['article', 'news', 'tutorial', 'guide', 'review', 'opinion', 'analysis', 'feature'],
        },
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}
