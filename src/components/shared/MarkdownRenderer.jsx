'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { parseMarkdown } from '@/utils/markdownEngine';
import QuizWidget from '@/components/shared/QuizWidget';
import useToastStore from '@/store/useToastStore';
import DOMPurify from 'dompurify';
import { Copy, Check, Play, AlertTriangle, Code2, ZoomIn, X, ChevronDown, ChevronUp } from 'lucide-react';

export default function MarkdownRenderer({
  content = '',
  className = '',
  typography = null,
  onCodePlay = null,
}) {
  const containerRef = useRef(null);
  const quizRootsRef = useRef([]);
  const { addToast } = useToastStore();

  // Parse markdown into sanitized HTML
  const htmlContent = useMemo(() => {
    return parseMarkdown(content);
  }, [content]);

  // Dynamic Hydration of Mermaid Diagrams, Quizzes, and Code Block Controls
  useEffect(() => {
    if (!containerRef.current || !content) return;

    let isMounted = true;

    // 1. Clean up previously mounted Quiz roots
    quizRootsRef.current.forEach((root) => {
      try {
        root.unmount();
      } catch (e) {
        // ignore
      }
    });
    quizRootsRef.current = [];

    // 2. Hydrate Interactive Quizzes
    const quizContainers = containerRef.current.querySelectorAll('.interactive-quiz-container');
    quizContainers.forEach((el) => {
      el.innerHTML = '';
      try {
        const rawQuestion = el.getAttribute('data-question');
        const rawOptions = el.getAttribute('data-options');
        const rawAnswer = el.getAttribute('data-answer');

        if (rawQuestion && rawOptions) {
          const question = decodeURIComponent(rawQuestion);
          const options = JSON.parse(decodeURIComponent(rawOptions));
          const correctAnswer = parseInt(rawAnswer, 10) || 0;

          const root = createRoot(el);
          root.render(
            <QuizWidget
              question={question}
              options={options}
              correctAnswer={correctAnswer}
            />
          );
          quizRootsRef.current.push(root);
        }
      } catch (err) {
        console.error('Failed to hydrate QuizWidget:', err);
      }
    });

    // 3. Hydrate Mermaid Diagrams with Strict Security & DOMPurify SVG Sanitization
    const mermaidContainers = containerRef.current.querySelectorAll('.mermaid-container');
    if (mermaidContainers.length > 0) {
      import('mermaid')
        .then((mermaidModule) => {
          if (!isMounted) return;
          const mermaid = mermaidModule.default;
          const isDark = document.documentElement.classList.contains('dark');

          mermaid.initialize({
            startOnLoad: false,
            theme: isDark ? 'dark' : 'neutral',
            securityLevel: 'strict', // Strict AST security preventing HTML script execution in diagrams
            fontFamily: 'Inter, system-ui, sans-serif',
          });

          mermaidContainers.forEach(async (el, index) => {
            const rawDiagram = el.getAttribute('data-mermaid');
            if (!rawDiagram) return;

            const diagramCode = decodeURIComponent(rawDiagram);
            const diagramId = `mermaid-render-${Date.now()}-${index}`;

            try {
              const { svg } = await mermaid.render(diagramId, diagramCode);
              if (!isMounted) return;

              // Double-sanitize SVG output before mounting into the DOM
              const sanitizedSvg = DOMPurify.sanitize(svg, {
                USE_PROFILES: { svg: true, svgFilters: true },
                ADD_TAGS: ['foreignObject'],
                ADD_ATTR: ['transform', 'style', 'class', 'id', 'width', 'height', 'viewBox'],
              });

              el.innerHTML = `
                <div class="mermaid-wrapper w-full flex flex-col items-center" dir="ltr">
                  <div class="mermaid-svg-wrapper w-full overflow-x-auto flex justify-center py-4">
                    ${sanitizedSvg}
                  </div>
                  <div class="mermaid-toolbar flex items-center justify-end gap-2 w-full pt-2 border-t border-zinc-200/60 dark:border-white/10 text-[11px] text-zinc-400">
                    <button type="button" class="view-mermaid-source-btn inline-flex items-center gap-1 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors">
                      <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>
                      <span>View Diagram Source</span>
                    </button>
                  </div>
                  <pre class="mermaid-source hidden w-full mt-3 p-3 text-xs font-mono bg-zinc-900 text-zinc-300 rounded-lg overflow-x-auto border border-zinc-700/50" dir="ltr">${diagramCode}</pre>
                </div>
              `;

              const sourceBtn = el.querySelector('.view-mermaid-source-btn');
              const sourcePre = el.querySelector('.mermaid-source');
              if (sourceBtn && sourcePre) {
                sourceBtn.addEventListener('click', () => {
                  sourcePre.classList.toggle('hidden');
                });
              }
            } catch (renderError) {
              console.warn('Mermaid diagram render error:', renderError);
              if (!isMounted) return;
              el.innerHTML = `
                <div class="w-full p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 text-amber-600 dark:text-amber-400 text-xs" dir="ltr">
                  <div class="flex items-center gap-2 font-bold mb-2">
                    <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                    <span>Diagram Syntax Issue</span>
                  </div>
                  <pre class="font-mono text-[11px] p-2.5 rounded-lg bg-zinc-900 text-zinc-300 overflow-x-auto">${diagramCode}</pre>
                </div>
              `;
            }
          });
        })
        .catch((err) => {
          console.error('Failed to initialize mermaid module:', err);
        });
    }

    // 4. Inject Code Block Actions (Copy, Try Live, Expand/Collapse)
    const preElements = containerRef.current.querySelectorAll('pre.hljs-code-block');
    preElements.forEach((pre) => {
      if (pre.querySelector('.code-actions-bar')) return;

      const actionsBar = document.createElement('div');
      actionsBar.className = 'code-actions-bar absolute top-2.5 right-2.5 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-auto z-10';

      // Expand / Collapse button if collapsible (> 35 lines)
      if (pre.classList.contains('is-collapsible')) {
        const expandBtn = document.createElement('button');
        expandBtn.type = 'button';
        expandBtn.className = 'p-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 text-[11px] font-semibold flex items-center gap-1 border border-zinc-700/50 backdrop-blur-md transition-colors';
        expandBtn.innerHTML = `
          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
          <span>Expand</span>
        `;
        expandBtn.addEventListener('click', () => {
          const isExpanded = pre.classList.toggle('max-h-none');
          if (isExpanded) {
            pre.classList.remove('max-h-96');
            expandBtn.innerHTML = `
              <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="18 15 12 9 6 15"></polyline></svg>
              <span>Collapse</span>
            `;
          } else {
            pre.classList.add('max-h-96');
            expandBtn.innerHTML = `
              <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
              <span>Expand</span>
            `;
          }
        });
        actionsBar.appendChild(expandBtn);
      }

      // Copy Code Button
      const copyBtn = document.createElement('button');
      copyBtn.type = 'button';
      copyBtn.className = 'p-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 text-[11px] font-semibold flex items-center gap-1 border border-zinc-700/50 backdrop-blur-md transition-colors';
      copyBtn.innerHTML = `
        <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
        <span>Copy</span>
      `;

      copyBtn.addEventListener('click', async () => {
        // Strip line numbers when copying code to clipboard
        const codeElement = pre.querySelector('code');
        let codeText = '';
        if (codeElement) {
          const lineSpans = codeElement.querySelectorAll('.code-line');
          if (lineSpans.length > 0) {
            codeText = Array.from(lineSpans)
              .map((span) => {
                const clone = span.cloneNode(true);
                const num = clone.querySelector('.code-line-number');
                if (num) num.remove();
                return clone.textContent;
              })
              .join('\n');
          } else {
            codeText = codeElement.innerText;
          }
        }

        try {
          await navigator.clipboard.writeText(codeText);
          copyBtn.innerHTML = `
            <svg class="w-3.5 h-3.5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            <span class="text-emerald-400">Copied!</span>
          `;
          addToast({ message: 'Code copied to clipboard', type: 'success' });
          setTimeout(() => {
            copyBtn.innerHTML = `
              <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
              <span>Copy</span>
            `;
          }, 2000);
        } catch (err) {
          console.error('Clipboard copy failed:', err);
        }
      });

      actionsBar.appendChild(copyBtn);

      // "Try Live" sandbox playground button
      if (onCodePlay) {
        const playBtn = document.createElement('button');
        playBtn.type = 'button';
        playBtn.className = 'p-1.5 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 text-[11px] font-semibold flex items-center gap-1 border border-indigo-500/30 backdrop-blur-md transition-colors';
        playBtn.innerHTML = `
          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          <span>Run</span>
        `;
        playBtn.addEventListener('click', () => {
          const codeElement = pre.querySelector('code');
          let codeText = '';
          if (codeElement) {
            const lineSpans = codeElement.querySelectorAll('.code-line');
            if (lineSpans.length > 0) {
              codeText = Array.from(lineSpans)
                .map((span) => {
                  const clone = span.cloneNode(true);
                  const num = clone.querySelector('.code-line-number');
                  if (num) num.remove();
                  return clone.textContent;
                })
                .join('\n');
            } else {
              codeText = codeElement.innerText;
            }
          }
          onCodePlay(codeText);
        });
        actionsBar.appendChild(playBtn);
      }

      pre.appendChild(actionsBar);
    });

    return () => {
      isMounted = false;
      quizRootsRef.current.forEach((root) => {
        try {
          root.unmount();
        } catch (e) {
          // ignore
        }
      });
      quizRootsRef.current = [];
    };
  }, [htmlContent, content, onCodePlay, addToast]);

  const typographyClass = typography
    ? `${typography.fontFamily || 'font-sans'} ${typography.fontSize || 'prose-lg'} ${typography.lineHeight || 'leading-relaxed'}`
    : 'font-sans prose-lg leading-relaxed';

  return (
    <div
      ref={containerRef}
      className={`prose prose-zinc dark:prose-invert max-w-none ${typographyClass} ${className}`}
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
}
