'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Search, Filter, Layers, Globe, Calendar, Flame, Clock, ArrowRight, Loader2 } from 'lucide-react';
import { searchAPI } from '@/services/api';
import BlogCard from '@/components/shared/BlogCard';

export default function SearchClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialQuery = searchParams.get('q') || '';
  const initialSection = searchParams.get('section') || '';
  const initialEdition = searchParams.get('edition') || '';
  const initialType = searchParams.get('contentType') || 'all';

  const [query, setQuery] = useState(initialQuery);
  const [section, setSection] = useState(initialSection);
  const [edition, setEdition] = useState(initialEdition);
  const [contentType, setContentType] = useState(initialType);
  const [sortBy, setSortBy] = useState('relevance');

  const [results, setResults] = useState([]);
  const [facets, setFacets] = useState({ sections: [], editions: [], contentTypes: [] });
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    performSearch();
  }, [searchParams]);

  const performSearch = async () => {
    setLoading(true);
    try {
      const q = searchParams.get('q') || '';
      const sec = searchParams.get('section') || '';
      const ed = searchParams.get('edition') || '';
      const type = searchParams.get('contentType') || '';

      const res = await searchAPI.search({
        q,
        section: sec,
        edition: ed,
        contentType: type,
        sortBy,
      });

      if (res.success && res.data) {
        setResults(res.data.posts || []);
        setTotal(res.data.pagination?.total || 0);
        if (res.data.facets) setFacets(res.data.facets);
      }
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilter = (newFilters = {}) => {
    const params = new URLSearchParams();
    const activeQ = newFilters.q !== undefined ? newFilters.q : query;
    const activeSec = newFilters.section !== undefined ? newFilters.section : section;
    const activeEd = newFilters.edition !== undefined ? newFilters.edition : edition;
    const activeType = newFilters.contentType !== undefined ? newFilters.contentType : contentType;

    if (activeQ) params.set('q', activeQ);
    if (activeSec) params.set('section', activeSec);
    if (activeEd) params.set('edition', activeEd);
    if (activeType && activeType !== 'all') params.set('contentType', activeType);

    router.push(`/search?${params.toString()}`);
  };

  return (
    <main className="pt-24 sm:pt-32 pb-16 sm:pb-24 max-w-7xl mx-auto px-4 sm:px-6">
      {/* Search Header */}
      <div className="mb-10 text-center max-w-2xl mx-auto">
        <h1 className="text-2xl sm:text-3xl md:text-5xl font-black font-display tracking-tight mb-4">
          Search the <span className="text-red-600">Newsroom</span>
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Discover stories, investigative reporting, tutorials, reviews, and regional coverage.
        </p>

        {/* Big Search Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleApplyFilter();
          }}
          className="mt-6 relative"
        >
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search topics, headlines, authors, keywords..."
            className="w-full px-5 sm:px-6 py-3.5 sm:py-4 pl-12 sm:pl-13 rounded-2xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-900 text-sm sm:text-base font-medium shadow-lg shadow-zinc-200/50 dark:shadow-none focus:outline-none focus:ring-2 focus:ring-red-500"
          />
          <Search className="w-5 h-5 text-zinc-400 absolute left-4.5 top-1/2 -translate-y-1/2" />
          <button
            type="submit"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors"
          >
            Search
          </button>
        </form>
      </div>

      {/* Filters Bar */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-white/10 p-3 sm:p-4 mb-8 sm:mb-10 flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center justify-between gap-3 sm:gap-4 text-xs font-bold">
        <div className="flex overflow-x-auto no-scrollbar items-center gap-3 pb-1 sm:pb-0">
          <div className="flex items-center gap-1.5 text-zinc-400 uppercase tracking-wider text-[10px]">
            <Filter className="w-3.5 h-3.5" /> Filter by:
          </div>

          {/* Section Filter */}
          <select
            value={section}
            onChange={(e) => {
              setSection(e.target.value);
              handleApplyFilter({ section: e.target.value });
            }}
            className="px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-zinc-950 text-xs"
          >
            <option value="">All Sections</option>
            {facets.sections?.map((s) => (
              <option key={s.slug} value={s.slug}>
                {s.name}
              </option>
            ))}
          </select>

          {/* Edition Filter */}
          <select
            value={edition}
            onChange={(e) => {
              setEdition(e.target.value);
              handleApplyFilter({ edition: e.target.value });
            }}
            className="px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-zinc-950 text-xs"
          >
            <option value="">All Editions</option>
            {facets.editions?.map((ed) => (
              <option key={ed.slug} value={ed.slug}>
                {ed.name} Edition
              </option>
            ))}
          </select>

          {/* Content Type Filter */}
          <select
            value={contentType}
            onChange={(e) => {
              setContentType(e.target.value);
              handleApplyFilter({ contentType: e.target.value });
            }}
            className="px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-zinc-950 text-xs capitalize"
          >
            <option value="all">All Content Types</option>
            {facets.contentTypes?.map((t) => (
              <option key={t} value={t} className="capitalize">
                {t}
              </option>
            ))}
          </select>
        </div>

        <div className="text-zinc-500 dark:text-zinc-400 text-xs">
          Found <span className="font-black text-zinc-900 dark:text-white">{total}</span> matching stories
        </div>
      </div>

      {/* Results Feed */}
      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-red-600 animate-spin" />
          <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Scanning archive...</p>
        </div>
      ) : results.length === 0 ? (
        <div className="py-24 text-center max-w-md mx-auto">
          <Search className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mx-auto mb-3" />
          <h3 className="text-lg font-bold">No matching stories found</h3>
          <p className="text-xs text-zinc-400 mt-1">
            Try adjusting your search query or removing filter constraints.
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {results.map((post) => (
            <BlogCard key={post._id} blog={post} />
          ))}
        </div>
      )}
    </main>
  );
}
