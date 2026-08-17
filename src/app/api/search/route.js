import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Post from '@/lib/models/post.model';
import Taxonomy from '@/lib/models/taxonomy.model';
import Admin from '@/lib/models/admin.model';
import { DEFAULT_STORIES } from '@/data/defaultStories';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get('q') || '').trim().toLowerCase();
    const section = (searchParams.get('section') || '').toLowerCase();
    const edition = (searchParams.get('edition') || '').toLowerCase();
    const contentType = searchParams.get('contentType');
    const tag = searchParams.get('tag');
    const author = searchParams.get('author');
    const sortBy = searchParams.get('sortBy') || 'relevance';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '12', 10);

    try {
      await connectToDatabase();

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

      const availableSections = await Taxonomy.find({ kind: 'section', active: true }).select('name slug').lean();
      const availableEditions = await Taxonomy.find({ kind: 'edition', active: true }).select('name slug').lean();

      if (posts && posts.length > 0) {
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
      }
    } catch (dbErr) {
      console.warn('Database error in search API, using fallback:', dbErr.message);
    }

    // Fallback in-memory search across DEFAULT_STORIES
    let filtered = [...DEFAULT_STORIES];

    if (q) {
      filtered = filtered.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.excerpt.toLowerCase().includes(q) ||
          (s.content && s.content.toLowerCase().includes(q)) ||
          s.tags?.some((t) => t.toLowerCase().includes(q)) ||
          s.categories?.some((c) => c.toLowerCase().includes(q)) ||
          s.author.toLowerCase().includes(q)
      );
    }

    if (section) {
      filtered = filtered.filter(
        (s) =>
          s.primarySection?.slug === section ||
          s.categories?.some((c) => c.toLowerCase().includes(section))
      );
    }

    if (edition) {
      filtered = filtered.filter((s) => s.editions?.some((e) => e.slug === edition));
    }

    if (contentType && contentType !== 'all') {
      filtered = filtered.filter((s) => s.contentType === contentType);
    }

    if (tag) {
      filtered = filtered.filter((s) => s.tags?.some((t) => t.toLowerCase() === tag.toLowerCase()));
    }

    if (author) {
      filtered = filtered.filter((s) => s.author.toLowerCase().includes(author.toLowerCase()));
    }

    const total = filtered.length;
    const paginated = filtered.slice((page - 1) * limit, page * limit);

    const fallbackSections = [
      { name: 'Technology', slug: 'technology' },
      { name: 'News', slug: 'news' },
      { name: 'Education', slug: 'education' },
      { name: 'Business', slug: 'business' },
      { name: 'Travel & Culture', slug: 'travel' },
      { name: 'Lifestyle', slug: 'lifestyle' },
    ];

    const fallbackEditions = [
      { name: 'Global Edition', slug: 'global' },
      { name: 'Kashmir Edition', slug: 'kashmir' },
      { name: 'India Edition', slug: 'india' },
    ];

    return NextResponse.json({
      success: true,
      data: {
        posts: paginated,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit) || 1,
        },
        facets: {
          sections: fallbackSections,
          editions: fallbackEditions,
          contentTypes: ['article', 'news', 'tutorial', 'guide', 'review', 'opinion', 'analysis', 'feature'],
        },
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}
