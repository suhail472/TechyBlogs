import Link from 'next/link';
import { ArrowRight, MapPin } from 'lucide-react';
import BlogCard from '@/components/shared/BlogCard';
import { DEFAULT_STORIES } from '@/data/defaultStories';

const typeLabel = { section: 'Section', edition: 'Edition', topic: 'Topic', tag: 'Tag' };

export default function TaxonomyLanding({ kind, item, posts = [] }) {
  const title = item?.name || 'Stories';
  const description = item?.description || `The latest ${title.toLowerCase()} stories, analysis, and useful guides from TeachyBlogs.`;
  
  let dataset = posts;
  if (!dataset || dataset.length === 0) {
    const slug = (item?.slug || '').toLowerCase();
    dataset = DEFAULT_STORIES.filter(
      (s) =>
        s.editions?.some((e) => e.slug === slug) ||
        s.primarySection?.slug === slug ||
        s.categories?.some((c) => c.toLowerCase().includes(slug)) ||
        s.tags?.some((t) => t.toLowerCase().includes(slug))
    );
    if (dataset.length === 0) dataset = DEFAULT_STORIES.slice(0, 3);
  }

  const hero = dataset[0];

  return (
    <main className="max-w-7xl mx-auto px-6 md:px-10 pt-32 pb-16">
      <header className="max-w-3xl border-b-4 border-zinc-950 dark:border-white pb-8">
        <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.22em] font-black text-red-700 dark:text-red-400">
          {kind === 'edition' && <MapPin className="w-3.5 h-3.5" />} {typeLabel[kind] || 'Discover'}
        </p>
        <h1 className="font-display text-4xl md:text-6xl font-black tracking-tight mt-3">{title}</h1>
        <p className="mt-4 text-base md:text-lg leading-relaxed text-zinc-600 dark:text-zinc-300">{description}</p>
      </header>

      {!hero ? (
        <div className="py-20 text-center"><p className="text-sm text-zinc-500">No published stories are available here yet.</p><Link href="/blogs" className="inline-flex mt-4 text-xs uppercase tracking-wider font-bold text-red-700 dark:text-red-400">Explore all stories</Link></div>
      ) : (
        <>
          <section className="grid lg:grid-cols-12 gap-8 py-10 border-b border-zinc-200 dark:border-white/10">
            <Link href={`/blog/${hero.slug}`} className="lg:col-span-7 group"><img src={hero.image || '/globe.svg'} alt={hero.title} className="w-full aspect-[16/9] rounded-xl object-cover bg-zinc-100 dark:bg-zinc-800" /></Link>
            <div className="lg:col-span-5 self-center"><p className="text-[10px] uppercase tracking-[0.18em] font-bold text-red-700 dark:text-red-400">Featured</p><Link href={`/blog/${hero.slug}`} className="group"><h2 className="font-display text-3xl font-black leading-tight mt-2 group-hover:text-red-700 dark:group-hover:text-red-300">{hero.title}</h2><p className="mt-3 text-zinc-600 dark:text-zinc-300 leading-relaxed">{hero.excerpt}</p><span className="inline-flex items-center gap-1.5 mt-5 text-xs uppercase tracking-wider font-bold text-red-700 dark:text-red-400">Read story <ArrowRight className="w-3.5 h-3.5" /></span></Link></div>
          </section>
          <section className="pt-8"><h2 className="font-display text-2xl font-black mb-6">Latest {title}</h2><div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">{dataset.slice(1).map((post) => <BlogCard key={String(post._id || post.slug)} blog={post} />)}</div></section>
        </>
      )}
    </main>
  );
}
