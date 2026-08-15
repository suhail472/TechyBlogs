import SearchClient from '@/components/pages/SearchClient';
import { Suspense } from 'react';

export const metadata = {
  title: 'Search Stories & Archives | TeachyBlogs',
  description: 'Search across news, tutorials, guides, reviews, and regional reporting on TeachyBlogs.',
};

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="py-32 text-center text-xs text-zinc-400 font-bold uppercase tracking-wider">Loading search interface...</div>}>
      <SearchClient />
    </Suspense>
  );
}
