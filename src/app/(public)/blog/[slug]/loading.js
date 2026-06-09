export default function PostLoading() {
  return (
    <div className="pt-32 pb-24 px-6 md:px-12 max-w-7xl mx-auto relative">
      <div className="container mx-auto">
        
        {/* Back Button Skeleton */}
        <div className="mb-8 animate-pulse">
          <div className="h-10 w-28 bg-zinc-200/50 dark:bg-white/[0.04] rounded-full" />
        </div>

        {/* Article Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14">
          
          {/* Main Article Column (8 cols) */}
          <div className="lg:col-span-8 space-y-8 animate-pulse">
            
            {/* Header section */}
            <div className="space-y-4">
              <div className="flex gap-2">
                <div className="h-6 w-16 bg-zinc-200/50 dark:bg-white/[0.04] rounded-full" />
                <div className="h-6 w-20 bg-zinc-200/50 dark:bg-white/[0.04] rounded-full" />
              </div>
              
              {/* Title blocks */}
              <div className="space-y-3">
                <div className="h-10 w-full bg-zinc-200/50 dark:bg-white/[0.04] rounded-xl" />
                <div className="h-10 w-10/12 bg-zinc-200/50 dark:bg-white/[0.04] rounded-xl" />
              </div>
              
              {/* Meta information */}
              <div className="h-5 w-48 bg-zinc-200/40 dark:bg-white/[0.02] rounded-md" />
            </div>

            {/* Featured Image placeholder */}
            <div className="aspect-[21/9] rounded-3xl bg-zinc-200/50 dark:bg-white/[0.04] w-full" />

            {/* Article Content blocks */}
            <div className="space-y-6 pt-4">
              <div className="space-y-2">
                <div className="h-4.5 w-full bg-zinc-200/40 dark:bg-white/[0.02] rounded" />
                <div className="h-4.5 w-full bg-zinc-200/40 dark:bg-white/[0.02] rounded" />
                <div className="h-4.5 w-11/12 bg-zinc-200/40 dark:bg-white/[0.02] rounded" />
                <div className="h-4.5 w-9/12 bg-zinc-200/40 dark:bg-white/[0.02] rounded" />
              </div>
              
              <div className="h-8 w-60 bg-zinc-200/50 dark:bg-white/[0.04] rounded-lg pt-4" />
              
              <div className="space-y-2">
                <div className="h-4.5 w-full bg-zinc-200/40 dark:bg-white/[0.02] rounded" />
                <div className="h-4.5 w-10/12 bg-zinc-200/40 dark:bg-white/[0.02] rounded" />
                <div className="h-4.5 w-11/12 bg-zinc-200/40 dark:bg-white/[0.02] rounded" />
              </div>
            </div>
          </div>

          {/* Sidebar Column (4 cols) */}
          <div className="lg:col-span-4 space-y-8 animate-pulse">
            
            {/* Author card skeleton */}
            <div className="glass-card rounded-[2rem] p-6 space-y-6">
              <div className="flex items-center gap-4">
                {/* Circle avatar */}
                <div className="w-12 h-12 rounded-full bg-zinc-200/50 dark:bg-white/[0.04] shrink-0" />
                {/* Name */}
                <div className="space-y-2 w-full">
                  <div className="h-5 w-24 bg-zinc-200/50 dark:bg-white/[0.04] rounded-md" />
                  <div className="h-3 w-16 bg-zinc-200/40 dark:bg-white/[0.02] rounded-md" />
                </div>
              </div>
              {/* Bio */}
              <div className="space-y-2">
                <div className="h-3 w-full bg-zinc-200/40 dark:bg-white/[0.02] rounded" />
                <div className="h-3 w-11/12 bg-zinc-200/40 dark:bg-white/[0.02] rounded" />
              </div>
              {/* Contact Button */}
              <div className="h-10 w-full bg-zinc-200/50 dark:bg-white/[0.04] rounded-xl" />
            </div>

            {/* Actions card skeleton */}
            <div className="glass-card rounded-2xl p-5">
              <div className="flex items-center justify-around gap-2">
                <div className="h-9 w-20 bg-zinc-200/50 dark:bg-white/[0.04] rounded-xl" />
                <div className="h-9 w-20 bg-zinc-200/50 dark:bg-white/[0.04] rounded-xl" />
                <div className="h-9 w-20 bg-zinc-200/50 dark:bg-white/[0.04] rounded-xl" />
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
