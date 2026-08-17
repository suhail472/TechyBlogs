import connectToDatabase from '@/lib/db';
import Post from '@/lib/models/post.model';
import Taxonomy from '@/lib/models/taxonomy.model';
import TaxonomyLanding from '@/components/pages/TaxonomyLanding';
import { DEFAULT_STORIES } from '@/data/defaultStories';

const SITE_URL = 'https://teachyblogs.com';

async function getKashmirData() {
  try {
    await connectToDatabase();
    const item = await Taxonomy.findOne({ kind: 'edition', slug: 'kashmir', active: true }).lean();
    const query = {
      status: { $in: ['published', 'updated'] },
      $or: [
        { editions: item?._id },
        { categories: /kashmir|srinagar|jammu/i },
        { tags: /kashmir|srinagar|dal lake|gulmarg/i },
      ],
    };
    const posts = await Post.find(query).sort({ breaking: -1, featured: -1, publishedAt: -1 }).limit(30).lean();
    
    if (posts && posts.length > 0) {
      return {
        item: item || {
          name: 'Kashmir',
          slug: 'kashmir',
          description: 'Independent reporting, investigative journalism, education updates, and cultural coverage from Jammu & Kashmir and Srinagar.',
          seo: { indexable: true },
        },
        posts: JSON.parse(JSON.stringify(posts)),
      };
    }
  } catch (err) {
    console.error('Error fetching Kashmir data:', err);
  }

  // Fallback dataset
  const kashmirFallbacks = DEFAULT_STORIES.filter(
    (p) => /kashmir|srinagar/i.test(p.categories?.join(' ')) || /kashmir|srinagar/i.test(p.title)
  );

  return {
    item: {
      name: 'Kashmir Bureau',
      slug: 'kashmir',
      description: 'Independent reporting, higher education & admissions, tourism dispatch, smart city developments, and cultural documentation across the Kashmir Valley and Srinagar.',
      seo: { indexable: true },
    },
    posts: kashmirFallbacks.length > 0 ? kashmirFallbacks : DEFAULT_STORIES,
  };
}

export const metadata = {
  title: 'Kashmir Edition — Independent Valley Journalism & Education | TeachyBlogs',
  description: 'Comprehensive coverage of Jammu & Kashmir: University admissions, local economy, tourism guides, infrastructure developments, and investigative reporting from Srinagar.',
  alternates: {
    canonical: `${SITE_URL}/kashmir`,
  },
  openGraph: {
    title: 'Kashmir Bureau | TeachyBlogs',
    description: 'In-depth reporting from the Kashmir valley, Srinagar developments, university admissions, and cultural heritage.',
    url: `${SITE_URL}/kashmir`,
    siteName: 'TeachyBlogs',
    locale: 'en_US',
    type: 'website',
  },
};

export default async function KashmirHubPage() {
  const { item, posts } = await getKashmirData();

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Kashmir Edition — TeachyBlogs',
    description: item.description,
    url: `${SITE_URL}/kashmir`,
    publisher: {
      '@type': 'NewsMediaOrganization',
      name: 'TeachyBlogs Kashmir Bureau',
      url: SITE_URL,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <TaxonomyLanding kind="edition" item={item} posts={posts} isKashmirHub={true} />
    </>
  );
}
