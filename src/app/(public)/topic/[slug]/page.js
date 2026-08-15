import connectToDatabase from '@/lib/db';
import Post from '@/lib/models/post.model';
import Taxonomy from '@/lib/models/taxonomy.model';
import TaxonomyLanding from '@/components/pages/TaxonomyLanding';

const SITE_URL = 'https://teachyblogs.com';
const displayName = (slug) => slug.split('-').map((word) => word[0]?.toUpperCase() + word.slice(1)).join(' ');
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

async function getTopic(slug) {
  await connectToDatabase();
  const item = await Taxonomy.findOne({ kind: 'topic', slug, active: true }).lean();
  const name = item?.name || displayName(slug);
  const query = {
    status: { $in: ['published', 'updated'] },
    $or: [
      { topics: item?._id },
      { tags: new RegExp(`^${escapeRegex(name)}$`, 'i') },
      { tags: slug },
    ],
  };
  const posts = await Post.find(query).sort({ featured: -1, publishedAt: -1 }).limit(24).lean();
  return { item: item || { name, slug, seo: { indexable: posts.length > 0 } }, posts: JSON.parse(JSON.stringify(posts)) };
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
