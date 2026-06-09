export default function AboutLoading() {
  return (
    <div className="pt-32 pb-24 px-6 md:px-12 max-w-7xl mx-auto relative">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center mb-20">
          
          {/* Details Column (7 cols) */}
          <div className="lg:col-span-7 space-y-6 animate-pulse">
            {/* Header Badge */}
            <div className="h-7 w-32 bg-zinc-200/50 dark:bg-white/[0.04] rounded-full" />
            
            {/* Main title */}
            <div className="space-y-3">
              <div className="h-10 w-full bg-zinc-200/50 dark:bg-white/[0.04] rounded-xl" />
              <div className="h-10 w-8/12 bg-zinc-200/50 dark:bg-white/[0.04] rounded-xl" />
            </div>
            
            {/* Paragraphs */}
            <div className="space-y-2.5 pt-2">
              <div className="h-4.5 w-full bg-zinc-200/40 dark:bg-white/[0.02] rounded" />
              <div className="h-4.5 w-full bg-zinc-200/40 dark:bg-white/[0.02] rounded" />
              <div className="h-4.5 w-11/12 bg-zinc-200/40 dark:bg-white/[0.02] rounded" />
            </div>

            <div className="h-11 w-44 bg-zinc-200/50 dark:bg-white/[0.04] rounded-xl pt-1" />
          </div>

          {/* Card Column (5 cols) */}
          <div className="lg:col-span-5 animate-pulse">
            <div className="relative p-8 rounded-[2rem] glass-card aspect-square max-w-md mx-auto flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div className="w-12 h-12 rounded-xl bg-zinc-200/50 dark:bg-white/[0.04]" />
                <div className="h-6 w-24 bg-zinc-200/50 dark:bg-white/[0.04] rounded-full" />
              </div>
              <div className="space-y-3">
                <div className="h-8 w-44 bg-zinc-200/50 dark:bg-white/[0.04] rounded-lg" />
                <div className="h-4 w-32 bg-zinc-200/40 dark:bg-white/[0.02] rounded-md" />
              </div>
            </div>
          </div>
        </div>

        {/* Highlights Section Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="glass-card p-6 rounded-2xl space-y-4">
              <div className="w-10 h-10 rounded-xl bg-zinc-200/50 dark:bg-white/[0.04]" />
              <div className="h-5 w-28 bg-zinc-200/50 dark:bg-white/[0.04] rounded-md" />
              <div className="space-y-1.5">
                <div className="h-3 w-full bg-zinc-200/40 dark:bg-white/[0.02] rounded" />
                <div className="h-3 w-10/12 bg-zinc-200/40 dark:bg-white/[0.02] rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
