import Link from 'next/link';
import { Globe, ArrowRight, BadgeCheck, MapPin, FileText, Share2 } from 'lucide-react';
import connectToDatabase from '@/lib/db';
import Admin from '@/lib/models/admin.model';
import Post, { getPublicPostFilter } from '@/lib/models/post.model';
import BlogCard from '@/components/shared/BlogCard';
import { notFound } from 'next/navigation';
import { DEFAULT_AUTHORS, DEFAULT_STORIES } from '@/data/defaultStories';

const SITE_URL = 'https://teachyblogs.com';

async function getAuthor(slug) {
  try {
    await connectToDatabase();
    const author = await Admin.findOne({
      $or: [{ slug }, { username: slug }],
    })
      .select('name title editorialRole bureau primaryDesk slug username avatar bio expertise website socialLinks role status verified seo')
      .lean();

    if (author) {
      const posts = await Post.find(
        getPublicPostFilter({
          $or: [{ primaryAuthor: author._id }, { author: author.name }, { 'authors.authorId': author._id }],
        })
      )
        .sort({ publishedAt: -1 })
        .limit(30)
        .lean();

      return { author: JSON.parse(JSON.stringify(author)), posts: JSON.parse(JSON.stringify(posts)) };
    }
  } catch (err) {
    // Database fallback
  }

  // Fallback to DEFAULT_AUTHORS
  const fallbackAuthor = DEFAULT_AUTHORS.find((a) => a.slug === slug || a.username === slug);
  if (fallbackAuthor) {
    const matchingPosts = DEFAULT_STORIES.filter(
      (s) => s.author === fallbackAuthor.name || s.primaryAuthor?.slug === slug
    );
    return { author: fallbackAuthor, posts: matchingPosts };
  }

  return null;
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const result = await getAuthor(slug);
  if (!result) return { title: 'Author | TeachyBlogs', robots: { index: false } };
  const { author } = result;

  const isIndexable = author.status === 'active' && author.seo?.indexable !== false;

  return {
    title: author.seo?.title || `${author.name} — ${author.title || 'Staff Writer'} | TeachyBlogs`,
    description: author.seo?.description || author.bio || `Read the latest journalism and analysis by ${author.name} on TeachyBlogs.`,
    alternates: { canonical: `${SITE_URL}/author/${slug}` },
    robots: {
      index: isIndexable,
      follow: true,
    },
    openGraph: {
      title: `${author.name} | TeachyBlogs`,
      description: author.bio || `Read articles by ${author.name}`,
      url: `${SITE_URL}/author/${slug}`,
      images: author.avatar ? [{ url: author.avatar }] : [],
    },
  };
}

export default async function AuthorPage({ params }) {
  const { slug } = await params;
  const result = await getAuthor(slug);
  if (!result) notFound();
  const { author, posts } = result;

  // Build clean sameAs array for JSON-LD without empty or invalid entries
  const sameAs = [];
  if (author.website && /^https?:\/\//i.test(author.website)) sameAs.push(author.website);
  if (author.socialLinks?.twitter && /^https?:\/\//i.test(author.socialLinks.twitter)) sameAs.push(author.socialLinks.twitter);
  if (author.socialLinks?.linkedin && /^https?:\/\//i.test(author.socialLinks.linkedin)) sameAs.push(author.socialLinks.linkedin);
  if (author.socialLinks?.github && /^https?:\/\//i.test(author.socialLinks.github)) sameAs.push(author.socialLinks.github);

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: author.name,
    jobTitle: author.title || 'Journalist',
    url: `${SITE_URL}/author/${slug}`,
    ...(author.avatar ? { image: author.avatar } : {}),
    ...(sameAs.length ? { sameAs } : {}),
  };

  return (
    <main className="max-w-7xl mx-auto px-6 md:px-10 pt-32 pb-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <header className="max-w-3xl pb-9 border-b-4 border-zinc-950 dark:border-white flex flex-col sm:flex-row gap-6 items-start">
        {author.avatar ? (
          <img src={author.avatar} alt={author.name} className="w-24 h-24 rounded-full object-cover shrink-0 border-2 border-zinc-200 dark:border-white/10" />
        ) : (
          <div className="w-24 h-24 rounded-full bg-red-700 text-white grid place-items-center font-display text-3xl font-black shrink-0">
            {author.name.slice(0, 1)}
          </div>
        )}
        <div className="space-y-2 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] uppercase tracking-wider font-mono font-bold text-red-700 dark:text-red-400">
              {author.title || 'Staff Correspondent'}
            </span>
            {author.verified && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full">
                <BadgeCheck className="w-3.5 h-3.5" />
                <span>Verified Byline</span>
              </span>
            )}
          </div>

          <h1 className="font-display text-4xl font-black text-zinc-900 dark:text-white">{author.name}</h1>

          {/* Bureau & Primary Desk Placement */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500 font-medium">
            {author.bureau && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-red-500" />
                <span>{author.bureau}</span>
              </span>
            )}
            {author.bureau && author.primaryDesk && <span>•</span>}
            {author.primaryDesk && (
              <span className="flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-blue-500" />
                <span>{author.primaryDesk}</span>
              </span>
            )}
          </div>

          {author.bio && <p className="mt-2 text-zinc-600 dark:text-zinc-300 leading-relaxed text-sm">{author.bio}</p>}

          {author.expertise?.length > 0 && (
            <p className="mt-2 text-xs font-bold text-zinc-500">Beats: {author.expertise.join(' · ')}</p>
          )}

          {/* Social Links & Website */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            {author.website && (
              <a
                href={author.website}
                rel="me noopener noreferrer"
                target="_blank"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:text-red-600"
              >
                <Globe className="w-3.5 h-3.5" /> Website
              </a>
            )}
            {author.socialLinks?.twitter && (
              <a
                href={author.socialLinks.twitter}
                rel="me noopener noreferrer"
                target="_blank"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:text-blue-500"
              >
                <Share2 className="w-3.5 h-3.5" /> X / Twitter
              </a>
            )}
            {author.socialLinks?.linkedin && (
              <a
                href={author.socialLinks.linkedin}
                rel="me noopener noreferrer"
                target="_blank"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:text-blue-600"
              >
                <Share2 className="w-3.5 h-3.5" /> LinkedIn
              </a>
            )}
            {author.socialLinks?.github && (
              <a
                href={author.socialLinks.github}
                rel="me noopener noreferrer"
                target="_blank"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white"
              >
                <Share2 className="w-3.5 h-3.5" /> GitHub
              </a>
            )}
          </div>
        </div>
      </header>

      <section className="pt-10">
        <h2 className="font-display text-2xl font-black mb-6 text-zinc-900 dark:text-white">Published Stories ({posts.length})</h2>
        {posts.length ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <BlogCard key={String(post._id || post.slug)} blog={post} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-zinc-500">No published stories yet.</p>
        )}
      </section>

      <Link
        href="/blogs"
        className="inline-flex items-center gap-1.5 mt-10 text-xs uppercase tracking-wider font-bold text-red-700 dark:text-red-400 hover:underline"
      >
        Explore all stories <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </main>
  );
}
