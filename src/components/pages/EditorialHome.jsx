import Link from 'next/link';
import { ArrowRight, Clock, Flame, MapPin } from 'lucide-react';
import BlogCard from '@/components/shared/BlogCard';
import { getReadingTime } from '@/utils/readingTime';

const label = (post) => post.primarySection?.name || post.categories?.[0] || 'Latest';
const image = (post) => post.image || '/globe.svg';
const date = (post) => new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(post.publishedAt || post.createdAt));

function StoryRow({ post, compact = false }) {
  return (
    <Link href={`/blog/${post.slug}`} className="group grid grid-cols-[1fr,110px] gap-4 py-5 border-b border-zinc-200/70 dark:border-white/10 last:border-0">
      <div>
        <p className="text-[10px] uppercase tracking-[0.16em] font-bold text-red-600 dark:text-red-400 mb-2">{label(post)}</p>
        <h3 className={`${compact ? 'text-base' : 'text-lg'} font-display font-bold leading-snug group-hover:text-red-700 dark:group-hover:text-red-300 transition-colors`}>{post.title}</h3>
        {!compact && <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400 line-clamp-2">{post.excerpt}</p>}
        <p className="mt-3 text-[11px] text-zinc-500 dark:text-zinc-400">{date(post)} · {getReadingTime(post.content)} min read</p>
      </div>
      <img src={image(post)} alt="" className="w-[110px] h-[84px] object-cover rounded-lg bg-zinc-100 dark:bg-zinc-800" />
    </Link>
  );
}

function SectionRail({ title, posts, href = '/blogs' }) {
  if (!posts.length) return null;
  return (
    <section className="border-t-4 border-zinc-950 dark:border-white pt-5">
      <div className="flex items-end justify-between gap-4 mb-5">
        <h2 className="font-display text-2xl font-black tracking-tight">{title}</h2>
        <Link href={href} className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-red-700 dark:text-red-400 hover:gap-2 transition-all">See all <ArrowRight className="w-3.5 h-3.5" /></Link>
      </div>
      <div className="grid md:grid-cols-3 gap-x-7">
        {posts.slice(0, 3).map((post) => <StoryRow key={String(post._id)} post={post} compact />)}
      </div>
    </section>
  );
}

export default function EditorialHome({ posts = [] }) {
  const ordered = [...posts].sort((a, b) => new Date(b.publishedAt || b.createdAt) - new Date(a.publishedAt || a.createdAt));
  const breaking = ordered.filter((post) => post.breaking).slice(0, 3);
  const hero = ordered.find((post) => post.featured) || ordered[0];
  const remainder = ordered.filter((post) => post._id !== hero?._id);
  const sectionNames = [...new Set(remainder.flatMap((post) => post.categories || []))].slice(0, 3);
  const regional = remainder.filter((post) => post.editions?.length || /kashmir|india|jammu/i.test((post.categories || []).join(' ')));

  if (!hero) {
    return <main className="max-w-6xl mx-auto px-6 pt-40 pb-28 text-center"><p className="text-xs uppercase tracking-[0.2em] text-zinc-500">The newsroom is preparing its first edition.</p></main>;
  }

  return (
    <main className="pt-24 pb-16">
      {breaking.length > 0 && <div className="bg-red-700 text-white"><div className="max-w-7xl mx-auto px-6 py-2.5 flex items-center gap-3 overflow-hidden"><span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-[0.18em]"><Flame className="w-3.5 h-3.5" /> Breaking</span><div className="h-4 w-px bg-white/30" />{breaking.map((post) => <Link key={String(post._id)} href={`/blog/${post.slug}`} className="shrink-0 text-xs font-semibold hover:underline">{post.title}</Link>)}</div></div>}

      <div className="max-w-7xl mx-auto px-6 md:px-10">
        <div className="py-8 border-b border-zinc-200 dark:border-white/10 flex flex-wrap justify-between items-end gap-4">
          <div><p className="text-[10px] uppercase tracking-[0.24em] font-bold text-red-700 dark:text-red-400">Independent ideas · useful reporting</p><h1 className="font-display text-3xl md:text-5xl font-black tracking-tight mt-2">The TeachyBlogs Daily</h1></div>
          <p className="max-w-xs text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">Clear reporting and explainers across technology, culture, education, and the places that matter to you.</p>
        </div>

        <section className="grid lg:grid-cols-12 gap-8 py-9 border-b border-zinc-200 dark:border-white/10">
          <article className="lg:col-span-7 lg:border-r lg:pr-8 border-zinc-200 dark:border-white/10">
            <Link href={`/blog/${hero.slug}`} className="group block"><img src={image(hero)} alt={hero.title} className="w-full aspect-[16/8] object-cover rounded-xl bg-zinc-100 dark:bg-zinc-800" /><p className="mt-5 text-[10px] uppercase tracking-[0.18em] font-bold text-red-700 dark:text-red-400">{label(hero)}</p><h2 className="font-display text-3xl md:text-4xl font-black leading-[1.04] mt-2 group-hover:text-red-700 dark:group-hover:text-red-300 transition-colors">{hero.title}</h2><p className="mt-3 text-base text-zinc-600 dark:text-zinc-300 leading-relaxed max-w-2xl">{hero.subtitle || hero.excerpt}</p><p className="mt-4 flex items-center gap-2 text-xs text-zinc-500"><Clock className="w-3.5 h-3.5" /> {date(hero)} · {getReadingTime(hero.content)} min read</p></Link>
          </article>
          <aside className="lg:col-span-5"><h2 className="font-display font-black text-xl pb-3 border-b-2 border-zinc-950 dark:border-white">Latest</h2>{remainder.slice(0, 4).map((post) => <StoryRow key={String(post._id)} post={post} compact />)}</aside>
        </section>

        <section className="py-10 grid lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8"><SectionRail title="Editors' picks" posts={remainder.slice(0, 6)} /></div>
          <aside className="lg:col-span-4 rounded-xl bg-zinc-950 text-white p-7 self-start"><p className="text-[10px] uppercase tracking-[0.2em] text-red-300 font-bold">The briefing</p><h2 className="font-display text-2xl font-black mt-2">Smart reads, delivered weekly.</h2><p className="mt-3 text-sm leading-relaxed text-zinc-300">A focused digest of the reporting and ideas worth your time.</p><Link href="/contact" className="inline-flex mt-6 px-4 py-2.5 bg-white text-zinc-950 rounded-md text-xs font-black uppercase tracking-wider">Join the newsletter</Link></aside>
        </section>

        {sectionNames.map((name) => <SectionRail key={name} title={name} href={`/blogs?category=${encodeURIComponent(name)}`} posts={remainder.filter((post) => post.categories?.includes(name))} />)}
        {regional.length > 0 && <section className="mt-10 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/40 p-6"><p className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] font-bold text-red-700 dark:text-red-300"><MapPin className="w-3.5 h-3.5" /> Regional edition</p><div className="mt-4 grid md:grid-cols-3 gap-x-7">{regional.slice(0, 3).map((post) => <StoryRow key={String(post._id)} post={post} compact />)}</div></section>}
        <section className="mt-12 border-t-4 border-zinc-950 dark:border-white pt-5"><h2 className="font-display text-2xl font-black mb-5">More to explore</h2><div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">{remainder.slice(4, 10).map((post) => <BlogCard key={String(post._id)} blog={post} />)}</div></section>
      </div>
    </main>
  );
}
