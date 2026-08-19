import connectToDatabase from '@/lib/db';
import Post, { getPublicPostFilter } from '@/lib/models/post.model';
import Taxonomy from '@/lib/models/taxonomy.model';
import TaxonomyLanding from '@/components/pages/TaxonomyLanding';
import { DEFAULT_STORIES } from '@/data/defaultStories';

const SITE_URL = 'https://teachyblogs.com';
const displayName = (slug) => slug.split('-').map((word) => word[0]?.toUpperCase() + word.slice(1)).join(' ');

async function getRegionData(slug) {
  const name = displayName(slug);
  try {
    await connectToDatabase();
    const item = await Taxonomy.findOne({ kind: 'region', slug, active: true }).lean();
    const resolvedName = item?.name || name;

    const regionIds = item ? [item._id] : [];
    if (item) {
      const subRegions = await Taxonomy.find({ 'ancestors._id': item._id }).select('_id').lean();
      subRegions.forEach((sr) => regionIds.push(sr._id));
    }

    const query = getPublicPostFilter({
      $or: [
        { primaryRegion: { $in: regionIds } },
        { regions: { $in: regionIds } },
        { tags: slug },
        { tags: new RegExp(`^${resolvedName}$`, 'i') },
      ],
    });

    const posts = await Post.find(query)
      .populate('primaryTopic', 'name slug')
      .populate('primaryRegion', 'name slug')
      .sort({ featured: -1, publishedAt: -1 })
      .limit(24)
      .lean();

    return {
      item: item || { name: resolvedName, slug, isHub: true, seo: { indexable: posts.length > 0 } },
      posts: JSON.parse(JSON.stringify(posts)),
    };
  } catch (err) {
    const matchingFallback = DEFAULT_STORIES.filter(
      (s) =>
        s.regions?.some((r) => r.slug === slug) ||
        s.locations?.some((l) => l.slug === slug) ||
        s.title.toLowerCase().includes(slug.replace(/-/g, ' ')) ||
        s.excerpt.toLowerCase().includes(slug.replace(/-/g, ' '))
    );
    return {
      item: { name, slug, description: `Regional coverage, journalism, education, and culture across ${name}.`, isHub: true, seo: { indexable: true } },
      posts: matchingFallback.length ? matchingFallback : DEFAULT_STORIES.slice(0, 4),
    };
  }
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const { item, posts } = await getRegionData(slug);
  const title = item.seo?.title || `${item.name} News, Analysis & Stories | TeachyBlogs`;
  return {
    title,
    description: item.seo?.description || item.description || `In-depth regional reporting, education, culture, and affairs in ${item.name}.`,
    alternates: { canonical: `${SITE_URL}/region/${slug}` },
    robots: posts.length ? { index: item.seo?.indexable !== false, follow: true } : { index: false, follow: true },
  };
}

export default async function RegionPage({ params }) {
  const { slug } = await params;
  const { item, posts } = await getRegionData(slug);
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: item.name,
    description: item.description,
    url: `${SITE_URL}/region/${slug}`,
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <TaxonomyLanding kind="region" item={item} posts={posts} />
    </>
  );
}
