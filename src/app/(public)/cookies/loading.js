export default function LegalLoading() {
  return (
    <div className="pt-40 pb-24 px-6 md:px-12 max-w-4xl mx-auto animate-pulse">
      <div className="space-y-10">
        
        {/* Header Section */}
        <header className="space-y-4">
          <div className="h-6 w-16 bg-zinc-200/50 dark:bg-white/[0.04] rounded-md" />
          <div className="h-10 w-80 bg-zinc-200/50 dark:bg-white/[0.04] rounded-xl" />
          <div className="h-4 w-40 bg-zinc-200/40 dark:bg-white/[0.02] rounded-md" />
        </header>

        {/* Prose body content placeholder */}
        <div className="space-y-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-3">
              <div className="h-7 w-48 bg-zinc-200/50 dark:bg-white/[0.04] rounded-lg" />
              <div className="space-y-2">
                <div className="h-4.5 w-full bg-zinc-200/40 dark:bg-white/[0.02] rounded" />
                <div className="h-4.5 w-full bg-zinc-200/40 dark:bg-white/[0.02] rounded" />
                <div className="h-4.5 w-11/12 bg-zinc-200/40 dark:bg-white/[0.02] rounded" />
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
