import connectToDatabase from '@/lib/db';
import Post from '@/lib/models/post.model';
import Taxonomy from '@/lib/models/taxonomy.model';
import TaxonomyLanding from '@/components/pages/TaxonomyLanding';

const SITE_URL = 'https://teachyblogs.com';
const displayName = (slug) => slug.split('-').map((word) => word[0]?.toUpperCase() + word.slice(1)).join(' ');
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

async function getSection(slug) {
  await connectToDatabase();
  const item = await Taxonomy.findOne({ kind: 'section', slug, active: true }).lean();
  const name = item?.name || displayName(slug);
  const query = { status: { $in: ['published', 'updated'] }, $or: [{ primarySection: item?._id }, { sections: item?._id }, { categories: new RegExp(`^${escapeRegex(name)}$`, 'i') }] };
  const posts = await Post.find(query).sort({ featured: -1, publishedAt: -1 }).limit(24).lean();
  return { item: item || { name, slug, seo: { indexable: posts.length > 0 } }, posts: JSON.parse(JSON.stringify(posts)) };
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const { item, posts } = await getSection(slug);
  const title = item.seo?.title || `${item.name} | TeachyBlogs`;
  return { title, description: item.seo?.description || item.description, alternates: { canonical: `${SITE_URL}/section/${slug}` }, robots: posts.length ? { index: item.seo?.indexable !== false, follow: true } : { index: false, follow: true } };
}

export default async function SectionPage({ params }) {
  const { slug } = await params;
  const { item, posts } = await getSection(slug);
  const schema = { '@context': 'https://schema.org', '@type': 'CollectionPage', name: item.name, description: item.description, url: `${SITE_URL}/section/${slug}` };
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} /><TaxonomyLanding kind="section" item={item} posts={posts} /></>;
}

