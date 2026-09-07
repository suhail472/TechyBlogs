export default function Loading() {
  return (
    <div className="min-h-[50vh] flex items-center justify-center p-12">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 rounded-full border-2 border-red-600 border-t-transparent animate-spin" />
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Loading TechyBlogs...</span>
      </div>
    </div>
  );
}
