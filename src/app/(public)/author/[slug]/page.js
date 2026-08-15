import Link from 'next/link';
import { Globe, ArrowRight } from 'lucide-react';
import connectToDatabase from '@/lib/db';
import Admin from '@/lib/models/admin.model';
import Post from '@/lib/models/post.model';
import BlogCard from '@/components/shared/BlogCard';
import { notFound } from 'next/navigation';

const SITE_URL = 'https://teachyblogs.com';

async function getAuthor(slug) {
  try {
    await connectToDatabase();
    const author = await Admin.findOne({ $or: [{ slug }, { username: slug }] }).select('name slug username avatar bio expertise website socialLinks role').lean();
    if (!author) return null;
    const posts = await Post.find({ status: { $in: ['published', 'updated'] }, $or: [{ primaryAuthor: author._id }, { author: author.name }, { 'authors.authorId': author._id }] }).sort({ publishedAt: -1 }).limit(30).lean();
    return { author: JSON.parse(JSON.stringify(author)), posts: JSON.parse(JSON.stringify(posts)) };
  } catch (err) {
    return null;
  }
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const result = await getAuthor(slug);
  if (!result) return { title: 'Author | TeachyBlogs', robots: { index: false } };
  const { author } = result;
  return { title: `${author.name} | TeachyBlogs`, description: author.bio || `Read the latest work from ${author.name} on TeachyBlogs.`, alternates: { canonical: `${SITE_URL}/author/${slug}` } };
}

export default async function AuthorPage({ params }) {
  const { slug } = await params;
  const result = await getAuthor(slug);
  if (!result) notFound();
  const { author, posts } = result;
  const schema = { '@context': 'https://schema.org', '@type': 'Person', name: author.name, url: `${SITE_URL}/author/${slug}`, ...(author.website ? { sameAs: [author.website] } : {}) };
  return (
    <main className="max-w-7xl mx-auto px-6 md:px-10 pt-32 pb-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <header className="max-w-3xl pb-9 border-b-4 border-zinc-950 dark:border-white flex gap-6 items-start">
        {author.avatar ? <img src={author.avatar} alt={author.name} className="w-20 h-20 rounded-full object-cover" /> : <div className="w-20 h-20 rounded-full bg-red-700 text-white grid place-items-center font-display text-2xl font-black">{author.name.slice(0, 1)}</div>}
        <div><p className="text-[10px] uppercase tracking-[0.2em] font-black text-red-700 dark:text-red-400">{author.role || 'Author'}</p><h1 className="font-display text-4xl font-black mt-2">{author.name}</h1>{author.bio && <p className="mt-3 text-zinc-600 dark:text-zinc-300 leading-relaxed">{author.bio}</p>}{author.expertise?.length > 0 && <p className="mt-3 text-xs font-bold text-zinc-500">Covers: {author.expertise.join(' · ')}</p>}{author.website && <a href={author.website} rel="me noopener noreferrer" target="_blank" className="inline-flex items-center gap-1.5 mt-4 text-xs uppercase tracking-wider font-bold text-red-700 dark:text-red-400"><Globe className="w-3.5 h-3.5" /> Website</a>}</div>
      </header>
      <section className="pt-8"><h2 className="font-display text-2xl font-black mb-6">Latest from {author.name}</h2>{posts.length ? <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">{posts.map((post) => <BlogCard key={String(post._id)} blog={post} />)}</div> : <p className="text-sm text-zinc-500">No published stories yet.</p>}</section>
      <Link href="/blogs" className="inline-flex items-center gap-1.5 mt-10 text-xs uppercase tracking-wider font-bold text-red-700 dark:text-red-400">Explore all stories <ArrowRight className="w-3.5 h-3.5" /></Link>
    </main>
  );
}
