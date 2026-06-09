export default function BlogsLoading() {
  return (
    <div className="pt-36 pb-24 px-6 md:px-12 max-w-7xl mx-auto relative">
      <div className="container mx-auto">
        
        {/* Archive Page Header Skeleton */}
        <header className="max-w-2xl mb-12 animate-pulse space-y-4">
          {/* Badge */}
          <div className="h-8 w-36 bg-zinc-200/50 dark:bg-white/[0.04] rounded-full" />
          
          {/* Title */}
          <div className="h-10 w-80 bg-zinc-200/50 dark:bg-white/[0.04] rounded-xl" />
          
          {/* Subtitle */}
          <div className="space-y-2 pt-2">
            <div className="h-4 w-full bg-zinc-200/40 dark:bg-white/[0.02] rounded" />
            <div className="h-4 w-9/12 bg-zinc-200/40 dark:bg-white/[0.02] rounded" />
          </div>
        </header>

        {/* Filter Toolbar Skeleton */}
        <div className="flex flex-col lg:flex-row gap-6 items-center justify-between border-y border-zinc-200/80 dark:border-white/[0.06] py-8 mb-12 animate-pulse">
          <div className="flex flex-wrap gap-2 w-full lg:w-auto">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-9 w-20 bg-zinc-200/50 dark:bg-white/[0.04] rounded-xl" />
            ))}
          </div>
          <div className="h-10 w-full lg:w-80 bg-zinc-200/50 dark:bg-white/[0.04] rounded-xl" />
        </div>

        {/* Articles Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="glass-card rounded-[2rem] overflow-hidden flex flex-col p-4 space-y-4 animate-pulse">
              {/* Card Image */}
              <div className="aspect-[16/10] rounded-[1.5rem] bg-zinc-200/50 dark:bg-white/[0.04] w-full" />
              
              {/* Category tag */}
              <div className="h-5 w-20 bg-zinc-200/50 dark:bg-white/[0.04] rounded-full" />
              
              {/* Title */}
              <div className="space-y-2">
                <div className="h-6 w-11/12 bg-zinc-200/50 dark:bg-white/[0.04] rounded-lg" />
                <div className="h-6 w-8/12 bg-zinc-200/50 dark:bg-white/[0.04] rounded-lg" />
              </div>
              
              {/* Excerpt */}
              <div className="space-y-1.5">
                <div className="h-3.5 w-full bg-zinc-200/40 dark:bg-white/[0.02] rounded" />
                <div className="h-3.5 w-10/12 bg-zinc-200/40 dark:bg-white/[0.02] rounded" />
              </div>
              
              {/* Meta information */}
              <div className="flex justify-between items-center pt-2">
                <div className="h-4 w-24 bg-zinc-200/40 dark:bg-white/[0.02] rounded" />
                <div className="h-4 w-12 bg-zinc-200/40 dark:bg-white/[0.02] rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
