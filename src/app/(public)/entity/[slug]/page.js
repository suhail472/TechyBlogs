import connectToDatabase from '@/lib/db';
import Post, { getPublicPostFilter } from '@/lib/models/post.model';
import Taxonomy from '@/lib/models/taxonomy.model';
import TaxonomyLanding from '@/components/pages/TaxonomyLanding';
import { notFound } from 'next/navigation';

const SITE_URL = 'https://techyblogs.com';

const KNOWN_STATIC_ENTITIES = {
  'university-of-kashmir': {
    name: 'University of Kashmir',
    slug: 'university-of-kashmir',
    type: 'EducationalOrganization',
    description: 'Premier higher education university in Hazratbal, Srinagar offering postgraduate, undergraduate, and research programs across arts, science, and technology.',
    sameAs: 'https://www.wikidata.org/wiki/Q3632009',
  },
  'nit-srinagar': {
    name: 'NIT Srinagar',
    slug: 'nit-srinagar',
    type: 'EducationalOrganization',
    description: 'National Institute of Technology Srinagar, an institute of national importance located on the banks of Dal Lake, Hazratbal.',
    sameAs: 'https://www.wikidata.org/wiki/Q6973657',
  },
  openai: {
    name: 'OpenAI',
    slug: 'openai',
    type: 'Organization',
    description: 'Artificial intelligence research and deployment company behind GPT-4, ChatGPT, and modern generative AI technologies.',
    sameAs: 'https://www.wikidata.org/wiki/Q22670110',
  },
  google: {
    name: 'Google',
    slug: 'google',
    type: 'Organization',
    description: 'Global technology leader in internet-related services, cloud computing, generative AI, search, and software.',
    sameAs: 'https://www.wikidata.org/wiki/Q95',
  },
  apple: {
    name: 'Apple',
    slug: 'apple',
    type: 'Organization',
    description: 'Multinational technology company designing consumer electronics, computer software, hardware, and mobile operating systems.',
    sameAs: 'https://www.wikidata.org/wiki/Q312',
  },
  microsoft: {
    name: 'Microsoft',
    slug: 'microsoft',
    type: 'Organization',
    description: 'Global technology corporation developing personal computing, enterprise cloud systems, and AI platforms.',
    sameAs: 'https://www.wikidata.org/wiki/Q2283',
  },
};

function displayName(slug) {
  return slug
    .split('-')
    .map((word) => word[0]?.toUpperCase() + word.slice(1))
    .join(' ');
}

async function getEntityData(slug) {
  try {
    await connectToDatabase();
    const item = await Taxonomy.findOne({ kind: 'entity', slug, active: true }).lean();
    const staticInfo = KNOWN_STATIC_ENTITIES[slug] || null;

    const resolvedName = item?.name || staticInfo?.name || displayName(slug);
    const resolvedDesc = item?.description || staticInfo?.description || `In-depth reporting, updates, and analysis concerning ${resolvedName}.`;
    const resolvedType = staticInfo?.type || 'Thing';
    const sameAs = staticInfo?.sameAs || item?.meta?.sameAs || null;

    const entityIds = item ? [item._id] : [];
    const query = getPublicPostFilter({
      $or: [
        ...(entityIds.length ? [{ entities: { $in: entityIds } }] : []),
        { tags: slug },
        { tags: new RegExp(`^${resolvedName}$`, 'i') },
        { title: new RegExp(`\\b${resolvedName}\\b`, 'i') },
      ],
    });

    const posts = await Post.find(query)
      .populate('primaryTopic', 'name slug')
      .populate('primaryRegion', 'name slug')
      .populate('primaryAuthor', 'name slug avatar')
      .sort({ publishedAt: -1 })
      .limit(24)
      .lean();

    return {
      item: {
        _id: item?._id || `entity_${slug}`,
        name: resolvedName,
        slug,
        description: resolvedDesc,
        type: resolvedType,
        sameAs,
        seo: { indexable: posts.length > 0 },
      },
      posts: JSON.parse(JSON.stringify(posts)),
    };
  } catch (err) {
    return {
      item: {
        name: displayName(slug),
        slug,
        description: `News and coverage on ${displayName(slug)}.`,
        seo: { indexable: false },
      },
      posts: [],
    };
  }
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const { item, posts } = await getEntityData(slug);
  const title = `${item.name} News, Coverage & Analysis | TechyBlogs`;

  return {
    title,
    description: item.description,
    alternates: { canonical: `${SITE_URL}/entity/${slug}` },
    robots: posts.length ? { index: item.seo?.indexable !== false, follow: true } : { index: false, follow: true },
    openGraph: {
      title,
      description: item.description,
      url: `${SITE_URL}/entity/${slug}`,
      siteName: 'TechyBlogs',
      type: 'website',
    },
  };
}

export default async function EntityPage({ params }) {
  const { slug } = await params;
  const { item, posts } = await getEntityData(slug);

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: item.name,
    description: item.description,
    url: `${SITE_URL}/entity/${slug}`,
    mainEntity: {
      '@type': item.type || 'Thing',
      name: item.name,
      ...(item.sameAs ? { sameAs: item.sameAs } : {}),
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <TaxonomyLanding kind="entity" item={item} posts={posts} />
    </>
  );
}
