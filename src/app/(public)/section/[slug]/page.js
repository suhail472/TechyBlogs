import connectToDatabase from '@/lib/db';
import Post, { getPublicPostFilter } from '@/lib/models/post.model';
import Taxonomy from '@/lib/models/taxonomy.model';
import TaxonomyLanding from '@/components/pages/TaxonomyLanding';
import { DEFAULT_STORIES } from '@/data/defaultStories';

const SITE_URL = 'https://teachyblogs.com';
const displayName = (slug) => slug.split('-').map((word) => word[0]?.toUpperCase() + word.slice(1)).join(' ');
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

async function getSection(slug) {
  const name = displayName(slug);
  let cleanPosts = [];
  let item = null;

  try {
    await connectToDatabase();
    item = await Taxonomy.findOne({ kind: 'section', slug, active: true }).lean();
    const resolvedName = item?.name || name;
    const query = getPublicPostFilter({
      $or: [{ primarySection: item?._id }, { sections: item?._id }, { categories: new RegExp(`^${escapeRegex(resolvedName)}$`, 'i') }],
    });
    const posts = await Post.find(query).sort({ featured: -1, publishedAt: -1 }).limit(24).lean();
    cleanPosts = posts ? JSON.parse(JSON.stringify(posts)) : [];
  } catch (err) {
    // ignore
  }

  if (cleanPosts.length === 0) {
    cleanPosts = DEFAULT_STORIES.filter((p) =>
      new RegExp(escapeRegex(slug.replace(/-/g, ' ')), 'i').test(
        (p.categories || []).join(' ') + ' ' + (p.primarySection?.name || '') + ' ' + (p.tags || []).join(' ') + ' ' + p.title
      )
    );
  }

  return {
    item: item || { name: item?.name || name, slug, seo: { indexable: true } },
    posts: cleanPosts.length > 0 ? cleanPosts : DEFAULT_STORIES.slice(0, 6),
  };
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
