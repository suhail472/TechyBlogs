import connectToDatabase from '@/lib/db';
import Post from '@/lib/models/post.model';
import Taxonomy from '@/lib/models/taxonomy.model';
import TaxonomyLanding from '@/components/pages/TaxonomyLanding';
import { DEFAULT_STORIES } from '@/data/defaultStories';

const SITE_URL = 'https://teachyblogs.com';
const displayName = (slug) => slug.split('-').map((word) => word[0]?.toUpperCase() + word.slice(1)).join(' ');
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

async function getTopic(slug) {
  const name = displayName(slug);
  try {
    await connectToDatabase();
    const item = await Taxonomy.findOne({ kind: 'topic', slug, active: true }).lean();
    const resolvedName = item?.name || name;
    const query = {
      status: { $in: ['published', 'updated'] },
      $or: [
        { topics: item?._id },
        { tags: new RegExp(`^${escapeRegex(resolvedName)}$`, 'i') },
        { tags: slug },
      ],
    };
    const posts = await Post.find(query).sort({ featured: -1, publishedAt: -1 }).limit(24).lean();
    return { item: item || { name: resolvedName, slug, seo: { indexable: posts.length > 0 } }, posts: JSON.parse(JSON.stringify(posts)) };
  } catch (err) {
    const matchingFallback = DEFAULT_STORIES.filter(
      (s) =>
        s.topics?.some((t) => t.slug === slug) ||
        s.tags?.some((t) => t.toLowerCase().includes(slug.replace(/-/g, ' '))) ||
        s.categories?.some((c) => c.toLowerCase().includes(slug.replace(/-/g, ' ')))
    );
    return {
      item: { name, slug, description: `Explore articles and tutorials on ${name}.`, seo: { indexable: true } },
      posts: matchingFallback.length ? matchingFallback : DEFAULT_STORIES.slice(0, 3),
    };
  }
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const { item, posts } = await getTopic(slug);
  const title = item.seo?.title || `${item.name} Stories & Analysis | TeachyBlogs`;
  return {
    title,
    description: item.seo?.description || item.description || `Explore comprehensive articles, guides and coverage on ${item.name}.`,
    alternates: { canonical: `${SITE_URL}/topic/${slug}` },
    robots: posts.length ? { index: item.seo?.indexable !== false, follow: true } : { index: false, follow: true },
  };
}

export default async function TopicPage({ params }) {
  const { slug } = await params;
  const { item, posts } = await getTopic(slug);
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: item.name,
    description: item.description,
    url: `${SITE_URL}/topic/${slug}`,
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <TaxonomyLanding kind="topic" item={item} posts={posts} />
    </>
  );
}
