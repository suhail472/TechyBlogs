import { Marked } from 'marked';
import katex from 'katex';
import hljs from 'highlight.js/lib/core';
import DOMPurify from 'dompurify';

// Register common programming languages in highlight.js
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import python from 'highlight.js/lib/languages/python';
import css from 'highlight.js/lib/languages/css';
import xml from 'highlight.js/lib/languages/xml';
import json from 'highlight.js/lib/languages/json';
import bash from 'highlight.js/lib/languages/bash';
import sql from 'highlight.js/lib/languages/sql';
import java from 'highlight.js/lib/languages/java';
import markdown from 'highlight.js/lib/languages/markdown';
import rust from 'highlight.js/lib/languages/rust';
import go from 'highlight.js/lib/languages/go';
import cpp from 'highlight.js/lib/languages/cpp';
import csharp from 'highlight.js/lib/languages/csharp';
import yaml from 'highlight.js/lib/languages/yaml';
import dockerfile from 'highlight.js/lib/languages/dockerfile';
import diff from 'highlight.js/lib/languages/diff';

hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('js', javascript);
hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('ts', typescript);
hljs.registerLanguage('jsx', javascript);
hljs.registerLanguage('tsx', typescript);
hljs.registerLanguage('python', python);
hljs.registerLanguage('py', python);
hljs.registerLanguage('css', css);
hljs.registerLanguage('html', xml);
hljs.registerLanguage('xml', xml);
hljs.registerLanguage('json', json);
hljs.registerLanguage('bash', bash);
hljs.registerLanguage('sh', bash);
hljs.registerLanguage('shell', bash);
hljs.registerLanguage('sql', sql);
hljs.registerLanguage('java', java);
hljs.registerLanguage('markdown', markdown);
hljs.registerLanguage('md', markdown);
hljs.registerLanguage('rust', rust);
hljs.registerLanguage('rs', rust);
hljs.registerLanguage('go', go);
hljs.registerLanguage('golang', go);
hljs.registerLanguage('cpp', cpp);
hljs.registerLanguage('c', cpp);
hljs.registerLanguage('csharp', csharp);
hljs.registerLanguage('cs', csharp);
hljs.registerLanguage('yaml', yaml);
hljs.registerLanguage('yml', yaml);
hljs.registerLanguage('dockerfile', dockerfile);
hljs.registerLanguage('docker', dockerfile);
hljs.registerLanguage('diff', diff);

// High-Performance Memoization Caches
const mathCache = new Map();
const highlightCache = new Map();

/**
 * Cached KaTeX Compiler
 */
function getRenderedMath(formula, display) {
  const key = `${display ? 'D' : 'I'}:${formula}`;
  if (mathCache.has(key)) return mathCache.get(key);

  let rendered = '';
  try {
    rendered = katex.renderToString(formula, {
      displayMode: display,
      throwOnError: false,
    });
  } catch (err) {
    rendered = `<span class="katex-error text-red-500 font-mono text-xs">${escapeHtml(formula)}</span>`;
  }

  if (mathCache.size > 3000) mathCache.clear();
  mathCache.set(key, rendered);
  return rendered;
}

/**
 * Configure Marked instance with GFM enabled
 */
function createMarkedInstance() {
  const marked = new Marked({
    gfm: true,
    breaks: false,
    pedantic: false,
  });

  return marked;
}

/**
 * Safe HTML entities escaping
 */
export function escapeHtml(str) {
  return (str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Slugify text for stable heading IDs
 */
export function slugify(text) {
  return (text || '')
    .toString()
    .toLowerCase()
    .trim()
    .replace(/<[^>]*>/g, '') // strip any html tags
    .replace(/&amp;/g, 'and')
    .replace(/&/g, 'and')
    .replace(/&[a-z0-9#]+;/gi, '')
    .replace(/[\*\_~`\$]/g, '') // strip markdown markers
    .replace(/[^\w\s-]/g, '') // remove non-word chars
    .replace(/[\s_-]+/g, '-') // replace spaces and underscores with hyphen
    .replace(/^-+|-+$/g, ''); // trim leading/trailing hyphens
}

/**
 * Check if a text is predominantly Right-to-Left (Urdu, Arabic, Persian, Kashmiri, Hebrew)
 */
export function isRTL(text) {
  if (!text) return false;
  // Arabic / Urdu / Kashmiri / Persian / Hebrew Unicode blocks
  const rtlRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\u0590-\u05FF]/;
  const sample = text.replace(/`[^`]*`/g, '').slice(0, 300);
  return rtlRegex.test(sample);
}

/**
 * Fence-Aware Preprocessing State Machine:
 * Ensures custom block syntaxes (Mermaid, Math $$, Callouts :::, Quizzes :::)
 * are NEVER intercepted if they appear inside code fences (``` or ~~~) or inline code (`...`).
 */
function preprocessMarkdown(markdownText) {
  if (!markdownText) {
    return {
      text: '',
      mermaidBlocks: [],
      mathBlocks: [],
      quizBlocks: [],
      calloutBlocks: [],
      footnoteDefs: new Map(),
    };
  }

  // Normalize line breaks
  const rawNormalized = markdownText.replace(/\r\n/g, '\n');

  const mermaidBlocks = [];
  const mathBlocks = [];
  const quizBlocks = [];
  const calloutBlocks = [];
  const footnoteDefs = new Map();

  const lines = rawNormalized.split('\n');
  const processedLines = [];

  let inCodeFence = false;
  let codeFenceMarker = '';
  let inMermaidBlock = false;
  let mermaidAccumulator = [];
  let inDisplayMathBlock = false;
  let displayMathAccumulator = [];
  let inQuizBlock = false;
  let quizAccumulator = [];
  let inCalloutBlock = false;
  let calloutMeta = { type: 'note', title: '' };
  let calloutAccumulator = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // 1. Check for Footnote Definitions [^id]: content
    const footnoteMatch = !inCodeFence && trimmed.match(/^\[\^([a-zA-Z0-9_-]+)\]:\s+(.*)$/);
    if (footnoteMatch) {
      const id = footnoteMatch[1];
      let content = footnoteMatch[2];
      while (i + 1 < lines.length && lines[i + 1].startsWith('    ')) {
        i++;
        content += ' ' + lines[i].trim();
      }
      footnoteDefs.set(id, content.trim());
      continue;
    }

    // 2. Track Standard Code Fences (``` or ~~~)
    const fenceMatch = trimmed.match(/^(`{3,}|~{3,})(.*)$/);
    if (fenceMatch) {
      const marker = fenceMatch[1];
      const lang = fenceMatch[2].trim().toLowerCase();

      if (!inCodeFence) {
        if (lang === 'mermaid') {
          inMermaidBlock = true;
          mermaidAccumulator = [];
          continue;
        } else {
          inCodeFence = true;
          codeFenceMarker = marker[0];
          processedLines.push(line);
          continue;
        }
      } else {
        if (codeFenceMarker && marker.startsWith(codeFenceMarker)) {
          inCodeFence = false;
          codeFenceMarker = '';
          processedLines.push(line);
          continue;
        }
      }
    }

    // If currently inside an active mermaid code block
    if (inMermaidBlock) {
      if (trimmed.startsWith('```') || trimmed.startsWith('~~~')) {
        inMermaidBlock = false;
        const placeholder = `@@MERMAID_BLOCK_${mermaidBlocks.length}@@`;
        mermaidBlocks.push(mermaidAccumulator.join('\n').trim());
        processedLines.push(placeholder);
      } else {
        mermaidAccumulator.push(line);
      }
      continue;
    }

    // If currently inside standard code fence, preserve line as-is
    if (inCodeFence) {
      processedLines.push(line);
      continue;
    }

    // 3. Track Display Math $$ ... $$
    if (trimmed === '$$') {
      if (!inDisplayMathBlock) {
        inDisplayMathBlock = true;
        displayMathAccumulator = [];
        continue;
      } else {
        inDisplayMathBlock = false;
        const placeholder = `@@DISPLAY_MATH_${mathBlocks.length}@@`;
        mathBlocks.push({ formula: displayMathAccumulator.join('\n').trim(), display: true });
        processedLines.push(placeholder);
        continue;
      }
    } else if (trimmed.startsWith('$$') && trimmed.endsWith('$$') && trimmed.length > 4) {
      const formula = trimmed.slice(2, -2).trim();
      const placeholder = `@@DISPLAY_MATH_${mathBlocks.length}@@`;
      mathBlocks.push({ formula, display: true });
      processedLines.push(placeholder);
      continue;
    }

    if (inDisplayMathBlock) {
      displayMathAccumulator.push(line);
      continue;
    }

    // 4. Track Callout Blocks :::note [title] ... :::
    const calloutStartMatch = trimmed.match(/^:::(note|tip|warning|important|danger|info|success)(?:[ \t]+(.*))?$/i);
    if (calloutStartMatch && !inCalloutBlock && !inQuizBlock) {
      inCalloutBlock = true;
      calloutMeta = {
        type: calloutStartMatch[1].toLowerCase(),
        title: (calloutStartMatch[2] || '').trim(),
      };
      calloutAccumulator = [];
      continue;
    }

    if (inCalloutBlock) {
      if (trimmed === ':::') {
        inCalloutBlock = false;
        const placeholder = `@@CALLOUT_BLOCK_${calloutBlocks.length}@@`;
        calloutBlocks.push({
          type: calloutMeta.type,
          title: calloutMeta.title,
          content: calloutAccumulator.join('\n').trim(),
        });
        processedLines.push(placeholder);
      } else {
        calloutAccumulator.push(line);
      }
      continue;
    }

    // 5. Track Quiz Blocks :::quiz ... :::
    if (trimmed === ':::quiz' && !inQuizBlock && !inCalloutBlock) {
      inQuizBlock = true;
      quizAccumulator = [];
      continue;
    }

    if (inQuizBlock) {
      if (trimmed === ':::') {
        inQuizBlock = false;
        let question = '';
        const options = [];
        let answer = 0;
        let readingOptions = false;

        for (const qLine of quizAccumulator) {
          const tLine = qLine.trim();
          if (tLine.startsWith('question:')) {
            question = tLine.replace('question:', '').trim();
            readingOptions = false;
          } else if (tLine.startsWith('options:')) {
            readingOptions = true;
          } else if (tLine.startsWith('answer:')) {
            answer = parseInt(tLine.replace('answer:', '').trim(), 10) || 0;
            readingOptions = false;
          } else if (readingOptions && (tLine.startsWith('-') || tLine.startsWith('*'))) {
            options.push(tLine.replace(/^[-*]\s+/, '').trim());
          }
        }

        const placeholder = `@@QUIZ_BLOCK_${quizBlocks.length}@@`;
        quizBlocks.push({ question, options, answer });
        processedLines.push(placeholder);
      } else {
        quizAccumulator.push(line);
      }
      continue;
    }

    // 6. Process Inline Math $...$ on regular lines (preserving inline code `...` and escaped \$)
    let processedLine = line;

    // Temporarily mask inline code blocks `...` to avoid touching dollars inside inline code
    const inlineCodeMasks = [];
    processedLine = processedLine.replace(/`([^`]+)`/g, (match) => {
      const mask = `__INLINE_CODE_MASK_${inlineCodeMasks.length}__`;
      inlineCodeMasks.push(match);
      return mask;
    });

    // Replace unescaped inline math $...$
    processedLine = processedLine.replace(/(^|[^\\])\$([^\$\s](?:[^\$]*?[^\$\s])?)\$/g, (match, prefix, formula) => {
      if (/^\d+(\.\d+)?$/.test(formula.trim())) {
        return match;
      }
      const placeholder = `@@INLINE_MATH_${mathBlocks.length}@@`;
      mathBlocks.push({ formula: formula.trim(), display: false });
      return `${prefix}${placeholder}`;
    });

    // Unescape escaped dollars \$ -> $
    processedLine = processedLine.replace(/\\\$/g, '$');

    // Restore inline code blocks
    inlineCodeMasks.forEach((codeMatch, idx) => {
      processedLine = processedLine.replace(`__INLINE_CODE_MASK_${idx}__`, codeMatch);
    });

    processedLines.push(processedLine);
  }

  // Handle unclosed blocks if any
  if (inMermaidBlock && mermaidAccumulator.length > 0) {
    const placeholder = `@@MERMAID_BLOCK_${mermaidBlocks.length}@@`;
    mermaidBlocks.push(mermaidAccumulator.join('\n').trim());
    processedLines.push(placeholder);
  }
  if (inDisplayMathBlock && displayMathAccumulator.length > 0) {
    const placeholder = `@@DISPLAY_MATH_${mathBlocks.length}@@`;
    mathBlocks.push({ formula: displayMathAccumulator.join('\n').trim(), display: true });
    processedLines.push(placeholder);
  }
  if (inCalloutBlock && calloutAccumulator.length > 0) {
    const placeholder = `@@CALLOUT_BLOCK_${calloutBlocks.length}@@`;
    calloutBlocks.push({
      type: calloutMeta.type,
      title: calloutMeta.title,
      content: calloutAccumulator.join('\n').trim(),
    });
    processedLines.push(placeholder);
  }
  if (inQuizBlock && quizAccumulator.length > 0) {
    const placeholder = `@@QUIZ_BLOCK_${quizBlocks.length}@@`;
    quizBlocks.push({ question: 'Quiz', options: [], answer: 0 });
    processedLines.push(placeholder);
  }

  return {
    text: processedLines.join('\n'),
    mermaidBlocks,
    mathBlocks,
    quizBlocks,
    calloutBlocks,
    footnoteDefs,
  };
}

/**
 * Format Code Lines with Diff Highlighting & Line Numbers (with Memoization)
 */
function formatCodeWithDiffAndLines(rawCode, language) {
  const key = `${language}:${rawCode}`;
  if (highlightCache.has(key)) return highlightCache.get(key);

  let highlighted = '';
  try {
    if (language && hljs.getLanguage(language)) {
      highlighted = hljs.highlight(rawCode, { language }).value;
    } else if (language) {
      highlighted = hljs.highlightAuto(rawCode).value;
    } else {
      highlighted = escapeHtml(rawCode);
    }
  } catch (err) {
    highlighted = escapeHtml(rawCode);
  }

  const isDiff = language === 'diff' || rawCode.includes('\n+') || rawCode.includes('\n-');
  const codeLines = highlighted.split('\n');

  let result = '';
  if (codeLines.length <= 2 && !isDiff) {
    result = highlighted;
  } else {
    const formattedLines = codeLines.map((lineHtml, idx) => {
      const plainLine = rawCode.split('\n')[idx] || '';
      let lineClass = 'code-line';

      if (isDiff) {
        if (plainLine.startsWith('+')) {
          lineClass += ' diff-add bg-emerald-500/10 text-emerald-300 font-semibold';
        } else if (plainLine.startsWith('-')) {
          lineClass += ' diff-del bg-rose-500/10 text-rose-300 line-through opacity-80';
        }
      }

      const lineNum = idx + 1;
      return `<span class="${lineClass} block px-4 py-0.5"><span class="code-line-number inline-block w-8 mr-3 text-right text-zinc-600 dark:text-zinc-500 select-none text-[11px] font-mono">${lineNum}</span>${lineHtml || ' '}</span>`;
    });
    result = formattedLines.join('');
  }

  if (highlightCache.size > 1500) highlightCache.clear();
  highlightCache.set(key, result);
  return result;
}

/**
 * Core Markdown parsing function with custom extensions
 */
export function parseMarkdownToHtml(markdownInput) {
  if (!markdownInput) return '';

  if (
    markdownInput.startsWith('<p>') ||
    markdownInput.startsWith('<h1>') ||
    markdownInput.startsWith('<h2>') ||
    markdownInput.startsWith('<div>')
  ) {
    if (!markdownInput.includes('```') && !markdownInput.includes(':::') && !markdownInput.includes('$$')) {
      return sanitizeHtml(markdownInput);
    }
  }

  const {
    text: preprocessedText,
    mermaidBlocks,
    mathBlocks,
    quizBlocks,
    calloutBlocks,
    footnoteDefs,
  } = preprocessMarkdown(markdownInput);

  const marked = createMarkedInstance();
  let headingCounter = 0;
  const footnoteReferences = [];

  const renderer = {
    heading({ tokens, depth }) {
      const text = this.parser.parseInline(tokens);
      const rawText = tokens.map((t) => t.raw || t.text || '').join('');
      const slug = slugify(rawText) || `section-${headingCounter}`;
      const id = `heading-${headingCounter++}-${slug}`;
      const tag = `h${depth}`;
      const rtlAttr = isRTL(rawText) ? ' dir="rtl"' : ' dir="auto"';
      const classes = depth === 1
        ? 'text-3xl md:text-4xl font-black tracking-tight mt-12 mb-5 text-zinc-900 dark:text-white font-display border-b border-zinc-200 dark:border-zinc-800 pb-3'
        : depth === 2
        ? 'text-2xl md:text-3xl font-black tracking-tight mt-10 mb-4 text-zinc-900 dark:text-white font-display'
        : depth === 3
        ? 'text-xl md:text-2xl font-bold tracking-tight mt-8 mb-3 text-zinc-900 dark:text-white font-display'
        : 'text-lg font-bold tracking-tight mt-6 mb-2 text-zinc-900 dark:text-white font-display';

      return `<${tag} id="${id}" class="${classes}"${rtlAttr}>${text}</${tag}>\n`;
    },

    paragraph({ tokens }) {
      const body = this.parser.parseInline(tokens);
      const plainText = body.replace(/<[^>]*>/g, '');
      const rtlAttr = isRTL(plainText) ? ' dir="rtl"' : ' dir="auto"';
      return `<p${rtlAttr} class="leading-relaxed my-4 text-zinc-700 dark:text-zinc-300">${body}</p>\n`;
    },

    code({ text, lang }) {
      const language = (lang || '').trim().toLowerCase();
      const formattedCode = formatCodeWithDiffAndLines(text, language);
      const langLabel = language ? `<span class="code-lang-label">${escapeHtml(language)}</span>` : '';
      const hasLangClass = language ? ' has-lang' : '';
      const lineCount = text.split('\n').length;
      const isCollapsible = lineCount > 35;
      const collapseClass = isCollapsible ? ' is-collapsible max-h-96 overflow-y-auto' : '';

      return `<pre class="hljs-code-block group${hasLangClass}${collapseClass}" dir="ltr">${langLabel}<code class="hljs${language ? ` language-${language}` : ''}">${formattedCode}</code></pre>\n`;
    },

    table(token) {
      let header = '';
      let body = '';

      if (token.header) {
        let headerRow = '';
        token.header.forEach((cell, idx) => {
          const align = token.align[idx] ? ` style="text-align: ${token.align[idx]}"` : '';
          headerRow += `<th${align}>${this.parser.parseInline(cell.tokens)}</th>`;
        });
        header = `<thead><tr>${headerRow}</tr></thead>`;
      }

      if (token.rows) {
        let bodyRows = '';
        token.rows.forEach((row) => {
          let rowHtml = '';
          row.forEach((cell, idx) => {
            const align = token.align[idx] ? ` style="text-align: ${token.align[idx]}"` : '';
            rowHtml += `<td${align}>${this.parser.parseInline(cell.tokens)}</td>`;
          });
          bodyRows += `<tr>${rowHtml}</tr>`;
        });
        body = `<tbody>${bodyRows}</tbody>`;
      }

      return `<div class="table-responsive" dir="auto"><table class="gfm-table">${header}${body}</table></div>\n`;
    },

    listitem(item) {
      if (item.task) {
        const checkbox = `<input type="checkbox" disabled ${item.checked ? 'checked ' : ''}/>`;
        const body = this.parser.parse(item.tokens);
        return `<li class="task-list-item">${checkbox}<div>${body}</div></li>\n`;
      }
      return `<li>${this.parser.parse(item.tokens)}</li>\n`;
    },

    list(token) {
      const type = token.ordered ? 'ol' : 'ul';
      let body = '';
      for (let j = 0; j < token.items.length; j++) {
        body += this.listitem(token.items[j]);
      }
      const isTaskList = token.items.some((i) => i.task);
      const listClass = isTaskList ? 'task-list' : (token.ordered ? 'list-decimal ml-6 space-y-1.5 my-4' : 'list-disc ml-6 space-y-1.5 my-4');
      return `<${type} class="${listClass}" dir="auto">\n${body}</${type}>\n`;
    },

    blockquote({ tokens }) {
      const body = this.parser.parse(tokens);
      return `<blockquote class="border-l-4 border-indigo-500 dark:border-indigo-400 pl-5 py-2 my-6 italic text-zinc-700 dark:text-zinc-300 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-r-xl" dir="auto">${body}</blockquote>\n`;
    },

    image({ href, title, text }) {
      const cleanHref = href || '';
      const altText = escapeHtml(text || '');
      const captionText = title ? `<figcaption class="article-figcaption" dir="auto">${escapeHtml(title)}</figcaption>` : (text ? `<figcaption class="article-figcaption" dir="auto">${altText}</figcaption>` : '');

      return `<figure class="article-figure"><img src="${cleanHref}" alt="${altText}" loading="lazy" class="rounded-2xl border border-zinc-200 dark:border-zinc-800 max-w-full mx-auto shadow-md hover:shadow-xl transition-shadow duration-300" />${captionText}</figure>\n`;
    },

    link({ href, title, tokens }) {
      const text = this.parser.parseInline(tokens);
      const titleAttr = title ? ` title="${escapeHtml(title)}"` : '';
      
      // Strict URL decoding & protocol inspection
      const normalizedHref = (href || '')
        .replace(/&#x?([0-9a-f]+);?/gi, (m, hex) => {
          try {
            return m.toLowerCase().startsWith('&#x')
              ? String.fromCharCode(parseInt(hex, 16))
              : String.fromCharCode(parseInt(hex, 10));
          } catch {
            return '';
          }
        })
        .replace(/[\u0000-\u001F\s]/g, '')
        .toLowerCase();

      const isDangerous =
        normalizedHref.startsWith('javascript:') ||
        normalizedHref.startsWith('vbscript:') ||
        normalizedHref.startsWith('data:text/html') ||
        normalizedHref.startsWith('data:image/svg+xml');

      const safeHref = isDangerous ? '#' : href;
      const isExternal = safeHref.startsWith('http') || safeHref.startsWith('//');
      const targetAttr = isExternal ? ' target="_blank" rel="noopener noreferrer"' : '';
      return `<a href="${safeHref}"${titleAttr}${targetAttr} class="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-semibold underline underline-offset-2 transition-colors">${text}</a>`;
    },
  };

  marked.use({ renderer });

  // 1. Parse standard Markdown through Marked
  let rawHtml = marked.parse(preprocessedText);

  // 2. Post-process Footnote inline references [^1]
  rawHtml = rawHtml.replace(/\[\^([a-zA-Z0-9_-]+)\]/g, (match, id) => {
    if (!footnoteReferences.includes(id)) {
      footnoteReferences.push(id);
    }
    const index = footnoteReferences.indexOf(id) + 1;
    return `<sup class="footnote-ref" id="fnref-${id}"><a href="#fn-${id}">[${index}]</a></sup>`;
  });

  // 3. Build Single-Pass Replacement Map for Custom Blocks
  const placeholderMap = new Map();

  mermaidBlocks.forEach((code, idx) => {
    const placeholder = `@@MERMAID_BLOCK_${idx}@@`;
    const encodedDiagram = encodeURIComponent(code);
    placeholderMap.set(
      placeholder,
      `<div class="mermaid-container my-8" data-mermaid="${encodedDiagram}" dir="ltr"><div class="mermaid-loading text-xs font-bold text-zinc-400 uppercase tracking-wider py-4 animate-pulse">Rendering diagram...</div></div>`
    );
  });

  mathBlocks.forEach((item, idx) => {
    const placeholder = item.display ? `@@DISPLAY_MATH_${idx}@@` : `@@INLINE_MATH_${idx}@@`;
    const mathHtml = getRenderedMath(item.formula, item.display);

    if (item.display) {
      placeholderMap.set(
        placeholder,
        `<div class="katex-display-wrapper overflow-x-auto py-3 my-4 flex justify-center text-zinc-900 dark:text-zinc-100" dir="ltr">${mathHtml}</div>`
      );
    } else {
      placeholderMap.set(
        placeholder,
        `<span class="katex-inline inline-block px-1" dir="ltr">${mathHtml}</span>`
      );
    }
  });

  quizBlocks.forEach((quiz, idx) => {
    const placeholder = `@@QUIZ_BLOCK_${idx}@@`;
    const encodedQuestion = encodeURIComponent(quiz.question);
    const encodedOptions = encodeURIComponent(JSON.stringify(quiz.options));
    placeholderMap.set(
      placeholder,
      `<div class="interactive-quiz-container my-8" data-question="${encodedQuestion}" data-options="${encodedOptions}" data-answer="${quiz.answer}"></div>`
    );
  });

  calloutBlocks.forEach((callout, idx) => {
    const placeholder = `@@CALLOUT_BLOCK_${idx}@@`;
    const defaultTitles = {
      note: 'Note',
      tip: 'Tip',
      warning: 'Warning',
      important: 'Important',
      danger: 'Caution',
      info: 'Info',
      success: 'Success',
    };
    const title = callout.title || defaultTitles[callout.type] || 'Note';
    const parsedCalloutContent = marked.parse(callout.content);
    placeholderMap.set(
      placeholder,
      `<div class="callout-block callout-${callout.type}" dir="auto"><div class="callout-header"><span>${escapeHtml(title)}</span></div><div class="callout-content text-sm leading-relaxed">${parsedCalloutContent}</div></div>`
    );
  });

  // 4. Execute High-Performance Single-Pass Replacement (O(N) vs O(N^2))
  rawHtml = rawHtml.replace(/<p>\s*(@@[A-Z_]+_\d+@@)\s*<\/p>|(@@[A-Z_]+_\d+@@)/g, (fullMatch, wrappedToken, directToken) => {
    const token = wrappedToken || directToken;
    return placeholderMap.get(token) || fullMatch;
  });

  // 5. Append Footnotes Section if any references exist
  if (footnoteReferences.length > 0 && footnoteDefs.size > 0) {
    let footnotesHtml = '<section class="footnotes mt-12 pt-6 border-t border-zinc-200 dark:border-white/10" dir="auto"><h4 class="text-xs font-black uppercase tracking-wider text-zinc-400 mb-3 font-display">Footnotes & References</h4><ol class="list-decimal pl-5 space-y-2 text-sm text-zinc-600 dark:text-zinc-400">';
    footnoteReferences.forEach((id) => {
      const content = footnoteDefs.get(id) || '';
      const parsedContent = marked.parseInline(content);
      footnotesHtml += `<li id="fn-${id}">${parsedContent} <a href="#fnref-${id}" class="footnote-backref" title="Back to reference">↩</a></li>`;
    });
    footnotesHtml += '</ol></section>';
    rawHtml += footnotesHtml;
  }

  // 6. Industrial-Grade Sanitization with DOMPurify
  return sanitizeHtml(rawHtml);
}

/**
 * Sanitize HTML with DOMPurify protecting against XSS and injection attacks
 */
export function sanitizeHtml(dirtyHtml) {
  if (!dirtyHtml) return '';

  if (typeof window === 'undefined') {
    return dirtyHtml
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
      .replace(/<embed\b[^>]*\/?>/gi, '')
      .replace(/on\w+\s*=\s*(?:'[^']*'|"[^"]*"|[^\s>]+)/gi, '')
      .replace(/href\s*=\s*['"]\s*(?:jav&#?[a-z0-9]+;?ascript|javascript|vbscript|data:\s*text\/html)[^'"]*['"]/gi, 'href="#"');
  }

  return DOMPurify.sanitize(dirtyHtml, {
    ALLOWED_TAGS: [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'div', 'span', 'blockquote', 'pre', 'code',
      'ul', 'ol', 'li', 'input', 'a', 'img', 'figure', 'figcaption', 'strong', 'em', 'del', 's', 'strike',
      'table', 'thead', 'tbody', 'tr', 'th', 'td', 'hr', 'br', 'sup', 'sub', 'section',
      // KaTeX MathML elements
      'math', 'mrow', 'mi', 'mn', 'mo', 'ms', 'mspace', 'mtext', 'msub', 'msup', 'msubsup',
      'mfrac', 'msqrt', 'mroot', 'mtable', 'mtr', 'mtd', 'mover', 'munder', 'munderover',
      'semantics', 'annotation',
      // SVG elements for diagrams/icons
      'svg', 'g', 'path', 'rect', 'circle', 'line', 'polyline', 'polygon', 'text', 'defs', 'use', 'style'
    ],
    ALLOWED_ATTR: [
      'id', 'class', 'style', 'href', 'title', 'target', 'rel', 'src', 'alt', 'width', 'height', 'loading',
      'type', 'checked', 'disabled', 'dir', 'data-mermaid', 'data-question', 'data-options', 'data-answer',
      'aria-hidden', 'aria-label', 'role', 'viewBox', 'fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin',
      'xmlns', 'displayMode'
    ],
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
    ALLOW_DATA_ATTR: true,
  });
}

/**
 * Extract Headings for Table of Contents using Marked AST Lexer for 100% ID synchronization
 */
export function extractHeadings(markdownInput) {
  if (!markdownInput) return [];

  // Filter custom blocks before lexing
  const cleanMarkdown = markdownInput
    .replace(/:::quiz[\s\S]*?:::/g, '')
    .replace(/:::(?:note|tip|warning|important|danger|info|success)[\s\S]*?:::/g, '');

  const markedInstance = createMarkedInstance();
  const tokens = markedInstance.lexer(cleanMarkdown);
  const headings = [];
  let headingCounter = 0;

  for (const token of tokens) {
    if (token.type === 'heading' && token.depth <= 3) {
      const rawText = token.tokens ? token.tokens.map((t) => t.raw || t.text || '').join('') : (token.text || '');
      const plainText = (token.text || rawText).replace(/<[^>]*>/g, '').replace(/[\*\_~`\$]/g, '');
      const slug = slugify(rawText) || `section-${headingCounter}`;
      const id = `heading-${headingCounter++}-${slug}`;
      headings.push({
        id,
        text: plainText.trim(),
        level: token.depth,
      });
    }
  }

  return headings;
}

export { parseMarkdownToHtml as parseMarkdown };
export default parseMarkdownToHtml;
