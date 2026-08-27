import connectToDatabase from '@/lib/db';
import Post, { getPublicPostFilter } from '@/lib/models/post.model';
import Taxonomy from '@/lib/models/taxonomy.model';
import TaxonomyLanding from '@/components/pages/TaxonomyLanding';
import { DEFAULT_STORIES } from '@/data/defaultStories';

const SITE_URL = 'https://teachyblogs.com';

async function getKashmirData() {
  try {
    await connectToDatabase();
    const item = await Taxonomy.findOne({ kind: 'edition', slug: 'kashmir', active: true }).lean();
    const query = getPublicPostFilter({
      $or: [
        { editions: item?._id },
        { categories: /kashmir|srinagar|jammu/i },
        { tags: /kashmir|srinagar|dal lake|gulmarg|baramulla|anantnag/i },
      ],
    });
    const posts = await Post.find(query).sort({ breaking: -1, featured: -1, publishedAt: -1 }).limit(30).lean();

    let cleanPosts = posts ? JSON.parse(JSON.stringify(posts)) : [];
    if (cleanPosts.length === 0) {
      cleanPosts = DEFAULT_STORIES.filter((p) =>
        /kashmir|srinagar|pampore|zabarwan|gulmarg/i.test((p.categories || []).join(' ') + ' ' + (p.tags || []).join(' ') + ' ' + p.title)
      );
    }

    return {
      item: item || {
        name: 'Kashmir Bureau',
        slug: 'kashmir',
        description: 'Independent reporting, investigative journalism, university admissions, and cultural documentation across Jammu & Kashmir and Srinagar.',
        seo: { indexable: true },
      },
      posts: cleanPosts,
    };
  } catch (err) {
    console.error('Error fetching Kashmir data:', err);
    const kashmirFallback = DEFAULT_STORIES.filter((p) =>
      /kashmir|srinagar|pampore|zabarwan|gulmarg/i.test((p.categories || []).join(' ') + ' ' + (p.tags || []).join(' ') + ' ' + p.title)
    );
    return {
      item: {
        name: 'Kashmir Bureau',
        slug: 'kashmir',
        description: 'Independent reporting, higher education, tourism dispatch, smart city developments, and cultural documentation across the Kashmir Valley and Srinagar.',
        seo: { indexable: true },
      },
      posts: kashmirFallback,
    };
  }
}

export const metadata = {
  title: 'Kashmir Edition — Independent Valley Journalism & Higher Education | TeachyBlogs',
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

  const collectionSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Kashmir Edition — TeachyBlogs',
    description: item.description,
    url: `${SITE_URL}/kashmir`,
    about: {
      '@type': 'Place',
      name: 'Jammu and Kashmir',
      geo: {
        '@type': 'GeoCoordinates',
        latitude: 34.0837,
        longitude: 74.7973,
      },
    },
    publisher: {
      '@type': 'NewsMediaOrganization',
      name: 'TeachyBlogs Kashmir Bureau',
      url: SITE_URL,
    },
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Kashmir Bureau', item: `${SITE_URL}/kashmir` },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <TaxonomyLanding kind="edition" item={item} posts={posts} isKashmirHub={true} />
    </>
  );
}
