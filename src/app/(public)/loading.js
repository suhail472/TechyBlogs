export default function HomeLoading() {
  return (
    <div className="pb-12 pt-20 lg:pt-22 relative max-w-[1440px] mx-auto px-6 md:px-12 lg:px-16">
      {/* Featured Hero Section Loading Skeleton */}
      <section className="py-6">
        <div className="relative p-8 md:py-10 md:px-12 lg:py-12 lg:px-16 rounded-[2.5rem] overflow-hidden glass-card">
          {/* Shimmer pattern background */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent animate-shimmer -translate-x-full" />
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center relative z-10">
            {/* Details (5 cols) */}
            <div className="lg:col-span-5 space-y-6 animate-pulse">
              <div className="flex gap-2">
                {/* Badge skeleton */}
                <div className="h-6 w-28 bg-zinc-200/50 dark:bg-white/[0.04] rounded-full" />
                <div className="h-6 w-16 bg-zinc-200/50 dark:bg-white/[0.04] rounded-full" />
              </div>
              
              {/* Title skeleton */}
              <div className="space-y-3">
                <div className="h-9 w-11/12 bg-zinc-200/50 dark:bg-white/[0.04] rounded-xl" />
                <div className="h-9 w-8/12 bg-zinc-200/50 dark:bg-white/[0.04] rounded-xl" />
              </div>
              
              {/* Excerpt skeleton */}
              <div className="space-y-2">
                <div className="h-4 w-full bg-zinc-200/40 dark:bg-white/[0.02] rounded" />
                <div className="h-4 w-11/12 bg-zinc-200/40 dark:bg-white/[0.02] rounded" />
                <div className="h-4 w-9/12 bg-zinc-200/40 dark:bg-white/[0.02] rounded" />
              </div>

              {/* Author info skeleton */}
              <div className="h-4 w-40 bg-zinc-200/40 dark:bg-white/[0.02] rounded-md" />

              {/* Read button skeleton */}
              <div className="pt-2">
                <div className="h-12 w-36 bg-zinc-200/50 dark:bg-white/[0.04] rounded-xl" />
              </div>
            </div>

            {/* Banner Image (7 cols) */}
            <div className="lg:col-span-7 animate-pulse">
              <div className="aspect-[16/9.5] rounded-[2rem] bg-zinc-200/50 dark:bg-white/[0.04]" />
            </div>
          </div>
        </div>
      </section>

      {/* Categories & Search Toolbar Skeleton */}
      <section className="py-6">
        <div className="flex flex-col lg:flex-row gap-6 items-center justify-between border-y border-zinc-200/80 dark:border-white/[0.06] py-8 animate-pulse">
          <div className="flex flex-wrap gap-2 w-full lg:w-auto">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-9 w-20 bg-zinc-200/50 dark:bg-white/[0.04] rounded-xl" />
            ))}
          </div>
          <div className="h-10 w-full lg:w-80 bg-zinc-200/50 dark:bg-white/[0.04] rounded-xl" />
        </div>
      </section>

      {/* Articles Grid Skeleton */}
      <section className="pt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-card rounded-[2rem] overflow-hidden flex flex-col p-4 space-y-4 animate-pulse">
              {/* Card Image */}
              <div className="aspect-[16/10] rounded-[1.5rem] bg-zinc-200/50 dark:bg-white/[0.04] w-full" />
              
              {/* Card category badge */}
              <div className="h-5 w-20 bg-zinc-200/50 dark:bg-white/[0.04] rounded-full" />
              
              {/* Card title */}
              <div className="space-y-2">
                <div className="h-6 w-11/12 bg-zinc-200/50 dark:bg-white/[0.04] rounded-lg" />
                <div className="h-6 w-8/12 bg-zinc-200/50 dark:bg-white/[0.04] rounded-lg" />
              </div>
              
              {/* Card excerpt */}
              <div className="space-y-1.5">
                <div className="h-3.5 w-full bg-zinc-200/40 dark:bg-white/[0.02] rounded" />
                <div className="h-3.5 w-10/12 bg-zinc-200/40 dark:bg-white/[0.02] rounded" />
              </div>
              
              {/* Card footer meta */}
              <div className="flex justify-between items-center pt-2">
                <div className="h-4 w-24 bg-zinc-200/40 dark:bg-white/[0.02] rounded" />
                <div className="h-4 w-12 bg-zinc-200/40 dark:bg-white/[0.02] rounded" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
