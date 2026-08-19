'use client';

import { Compass, Bot } from 'lucide-react';

export default function AiSuggestedChips({
  contentType = 'article',
  category = '',
  onSelectPrompt,
  disabled = false,
}) {
  const getChips = () => {
    const type = (contentType || '').toLowerCase();
    const cat = (category || '').toLowerCase();

    // 1. Technical & Coding Tutorials
    if (type === 'tutorial' || type === 'guide' || cat.includes('tech') || cat.includes('code')) {
      return [
        { label: 'Explain Technology', prompt: 'Explain the core technology and concepts discussed in this article in simple terms.' },
        { label: 'Key Technical Points', prompt: 'What are the main technical takeaways and implementation points?' },
        { label: 'Pros & Limitations', prompt: 'What are the key advantages and limitations mentioned in the piece?' },
        { label: 'What to Read Next', prompt: 'What related articles should I read next?' },
      ];
    }

    // 2. Reviews & Benchmark Assessments
    if (type === 'review' || cat.includes('review')) {
      return [
        { label: 'Pros & Cons', prompt: 'What are the key pros and cons highlighted in this review?' },
        { label: 'Final Verdict', prompt: 'What is the overall score and editorial verdict of this review?' },
        { label: 'Summary', prompt: 'Summarize the core findings and analysis of this review in 3 bullet points.' },
        { label: 'Related Reviews', prompt: 'What related product reviews or stories are available?' },
      ];
    }

    // 3. News & Breaking Dispatches
    if (type === 'news' || cat.includes('news')) {
      return [
        { label: 'What Happened?', prompt: 'What is the core event reported here and why does it matter?' },
        { label: 'Key Developments', prompt: 'What are the most important developments and timeline reported?' },
        { label: 'Who is Affected?', prompt: 'Who is most impacted by these developments according to the report?' },
        { label: 'Sources Cited', prompt: 'What sources and references are cited in this dispatch?' },
      ];
    }

    // 4. Travel & Regional Coverage
    if (cat.includes('travel') || cat.includes('kashmir') || cat.includes('tourism')) {
      return [
        { label: 'Key Recommendations', prompt: 'What are the main travel tips, destinations, and recommendations mentioned?' },
        { label: 'Planning & Costs', prompt: 'What planning considerations, logistics, or costs are discussed?' },
        { label: '3-Line Summary', prompt: 'Summarize this regional dispatch in 3 concise bullet points.' },
        { label: 'Related Stories', prompt: 'Show me related regional stories and travel journalism.' },
      ];
    }

    // 5. Opinion & Editorial Commentary
    if (type === 'opinion' || cat.includes('opinion') || cat.includes('business')) {
      return [
        { label: "Author's Argument", prompt: "What is the author's central argument and main perspective?" },
        { label: 'Main Assumptions', prompt: 'What core assumptions or data points support this analysis?' },
        { label: 'Pros & Cons', prompt: 'What counterarguments or contrasting viewpoints are considered?' },
        { label: 'Summary', prompt: 'Summarize the essay in 3 concise points.' },
      ];
    }

    // 6. Default General Journalism
    return [
      { label: '3-Line Summary', prompt: 'Summarize this article in 3 clear bullet points.' },
      { label: 'Key Takeaways', prompt: 'What are the key takeaways and main arguments?' },
      { label: 'Explain for Beginners', prompt: 'Explain the concepts in this article in simple words for a beginner.' },
      { label: 'Sources & Facts', prompt: 'What verified facts or data sources does this article rely on?' },
      { label: 'What to Read Next', prompt: 'What related articles should I read next?' },
    ];
  };

  const chips = getChips();

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 text-xs">
      <span className="text-[10px] font-mono font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider shrink-0 flex items-center gap-1 pl-1">
        <Compass className="w-3 h-3 text-red-500" /> Quick Actions:
      </span>
      {chips.map((chip, idx) => (
        <button
          key={idx}
          type="button"
          disabled={disabled}
          onClick={() => onSelectPrompt(chip.prompt)}
          className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-[#1f2535] hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400 border border-slate-200/90 dark:border-white/10 text-zinc-700 dark:text-zinc-300 font-semibold text-[11px] whitespace-nowrap shrink-0 transition-all active:scale-95 disabled:opacity-50 shadow-2xs"
        >
          {chip.label}
        </button>
      ))}
    </div>
  );
}
