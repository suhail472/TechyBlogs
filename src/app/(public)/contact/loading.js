export default function ContactLoading() {
  return (
    <div className="pt-32 pb-24 px-6 md:px-12 max-w-7xl mx-auto relative">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          
          {/* Info Column (5 cols) */}
          <div className="lg:col-span-5 space-y-8 animate-pulse lg:sticky lg:top-28">
            <div className="space-y-4">
              <div className="h-7 w-24 bg-zinc-200/50 dark:bg-white/[0.04] rounded-full" />
              <div className="h-10 w-80 bg-zinc-200/50 dark:bg-white/[0.04] rounded-xl" />
              <div className="h-4.5 w-full bg-zinc-200/40 dark:bg-white/[0.02] rounded" />
            </div>

            {/* List of contact details */}
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="glass-card p-5 rounded-2xl flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-zinc-200/50 dark:bg-white/[0.04] shrink-0" />
                  <div className="space-y-1.5 w-full">
                    <div className="h-3 w-16 bg-zinc-200/40 dark:bg-white/[0.02] rounded" />
                    <div className="h-4 w-36 bg-zinc-200/50 dark:bg-white/[0.04] rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Form Column (7 cols) */}
          <div className="lg:col-span-7 animate-pulse">
            <div className="relative p-6 md:p-8 rounded-[2rem] glass-card">
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <div className="h-4 w-16 bg-zinc-200/40 dark:bg-white/[0.02] rounded" />
                    <div className="h-11 w-full bg-zinc-200/50 dark:bg-white/[0.04] rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 w-16 bg-zinc-200/40 dark:bg-white/[0.02] rounded" />
                    <div className="h-11 w-full bg-zinc-200/50 dark:bg-white/[0.04] rounded-xl" />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="h-4 w-16 bg-zinc-200/40 dark:bg-white/[0.02] rounded" />
                  <div className="h-11 w-full bg-zinc-200/50 dark:bg-white/[0.04] rounded-xl" />
                </div>

                <div className="space-y-2">
                  <div className="h-4 w-16 bg-zinc-200/40 dark:bg-white/[0.02] rounded" />
                  <div className="h-32 w-full bg-zinc-200/50 dark:bg-white/[0.04] rounded-xl" />
                </div>

                <div className="h-12 w-full bg-zinc-200/50 dark:bg-white/[0.04] rounded-xl" />
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
