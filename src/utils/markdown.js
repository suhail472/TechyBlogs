/**
 * Parses raw markdown text into safe HTML strings.
 * Supports H1-H4, bold, italic, code blocks with syntax highlighting, lists, links, and blockquotes.
 * Respects existing HTML content for backward compatibility.
 */
import hljs from 'highlight.js/lib/core';

// Register common languages
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

hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('js', javascript);
hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('ts', typescript);
hljs.registerLanguage('python', python);
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
hljs.registerLanguage('jsx', javascript);
hljs.registerLanguage('tsx', typescript);

export function parseMarkdown(markdownInput) {
  if (!markdownInput) return '';
  
  // If it already looks like Quill HTML content, return it directly
  if (
    markdownInput.includes('<p>') ||
    markdownInput.includes('<h1>') ||
    markdownInput.includes('<ul>') ||
    markdownInput.includes('<strong>') ||
    markdownInput.includes('href=')
  ) {
    return markdownInput;
  }

  const codeBlocks = [];
  let html = markdownInput;

  // Parse Quiz block
  html = html.replace(/:::quiz\n([\s\S]*?)\n:::/g, (match, blockContent) => {
    let question = '';
    const options = [];
    let answer = 0;

    const lines = blockContent.split('\n');
    let readingOptions = false;

    for (let line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('question:')) {
        question = trimmed.replace('question:', '').trim();
        readingOptions = false;
      } else if (trimmed.startsWith('options:')) {
        readingOptions = true;
      } else if (trimmed.startsWith('answer:')) {
        answer = parseInt(trimmed.replace('answer:', '').trim()) || 0;
        readingOptions = false;
      } else if (readingOptions && (trimmed.startsWith('-') || trimmed.startsWith('*'))) {
        options.push(trimmed.replace(/^[-*]\s+/, '').trim());
      }
    }

    const encodedQuestion = encodeURIComponent(question);
    const encodedOptions = encodeURIComponent(JSON.stringify(options));

    return `<div class="interactive-quiz-container my-8" data-question="${encodedQuestion}" data-options="${encodedOptions}" data-answer="${answer}"></div>`;
  });

  // 1. Extract Code Blocks into placeholders to prevent parsing markdown rules inside code snippets
  html = html.replace(/```(\w*)\n?([\s\S]*?)```/g, (match, lang, code) => {
    const trimmedCode = code.trim();
    const escapedCode = trimmedCode
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    let highlighted;
    try {
      if (lang && hljs.getLanguage(lang)) {
        highlighted = hljs.highlight(trimmedCode, { language: lang }).value;
      } else {
        highlighted = hljs.highlightAuto(trimmedCode).value;
      }
    } catch (e) {
      highlighted = escapedCode;
    }

    const langLabel = lang ? `<span class="code-lang-label">${lang}</span>` : '';
    const codeBlockHtml = `<pre class="hljs-code-block relative group"><code class="hljs${lang ? ` language-${lang}` : ''}">${highlighted}</code>${langLabel}</pre>`;
    
    const placeholder = `__CODE_BLOCK_${codeBlocks.length}__`;
    codeBlocks.push(codeBlockHtml);
    return placeholder;
  });

  // Inline Code
  html = html.replace(/`([^`]+)`/g, '<code class="bg-zinc-100 dark:bg-zinc-800 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded font-mono text-xs">$1</code>');

  // Headings - Process sequentially in a single pass to ensure correct document-order IDs
  let headingCounter = 0;
  html = html.replace(/^(#{1,4})\s+(.*?)$/gm, (match, hashes, title) => {
    const level = hashes.length;
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    const id = `heading-${headingCounter++}-${slug}`;
    
    if (level === 4) {
      return `<h5 id="${id}" class="text-base font-black tracking-tight mt-6 mb-2 text-zinc-900 dark:text-white font-display">${title}</h5>`;
    } else if (level === 3) {
      return `<h4 id="${id}" class="text-lg font-black tracking-tight mt-8 mb-3 text-zinc-900 dark:text-white font-display">${title}</h4>`;
    } else if (level === 2) {
      return `<h3 id="${id}" class="text-xl font-black tracking-tight mt-10 mb-4 text-zinc-900 dark:text-white font-display">${title}</h3>`;
    } else {
      return `<h2 id="${id}" class="text-2xl font-black tracking-tight mt-12 mb-4 text-zinc-900 dark:text-white border-b border-zinc-200 dark:border-zinc-800 pb-2 font-display">${title}</h2>`;
    }
  });

  // Horizontal Rules
  html = html.replace(/^\s*---\s*$/gm, '<hr class="my-8 border-t border-zinc-200 dark:border-white/[0.06]" />');

  // Bold
  html = html.replace(/\*\*([\s\S]*?)\*\*/g, '<strong class="font-black text-zinc-900 dark:text-white">$1</strong>');

  // Italic
  html = html.replace(/\*([\s\S]*?)\*/g, '<em class="italic text-zinc-850 dark:text-zinc-250">$1</em>');

  // Blockquotes
  html = html.replace(/^> (.*?)$/gm, '<blockquote class="border-l-4 border-blue-500 pl-4 py-1 my-4 italic text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-900/40 rounded-r-lg">$1</blockquote>');

  // Image
  html = html.replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1" class="rounded-2xl border border-zinc-200 dark:border-zinc-800 max-w-full my-8 mx-auto cursor-zoom-in hover:shadow-xl transition-shadow duration-300" />');

  // Links
  html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-500 hover:text-blue-650 dark:text-blue-450 dark:hover:text-blue-350 font-semibold underline">$1</a>');

  // Lists parsing
  html = html.replace(/^\s*[-*]\s+(.*?)$/gm, '<li class="ml-6 list-disc mt-1 text-zinc-700 dark:text-zinc-300">$1</li>');
  html = html.replace(/^\s*\d+\.\s+(.*?)$/gm, '<li class="ml-6 list-decimal mt-1 text-zinc-700 dark:text-zinc-300">$1</li>');

  // Wrap consecutive list items in matching block tags
  html = html.replace(/(<li class="ml-6 list-disc mt-1 text-zinc-700 dark:text-zinc-300">[\s\S]*?<\/li>)+/g, '<ul class="space-y-1 my-4">$1</ul>');
  html = html.replace(/(<li class="ml-6 list-decimal mt-1 text-zinc-700 dark:text-zinc-300">[\s\S]*?<\/li>)+/g, '<ol class="space-y-1 my-4">$1</ol>');

  // Paragraphs
  const lines = html.split('\n\n');
  const paragraphs = lines.map(line => {
    const trimmed = line.trim();
    if (!trimmed) return '';
    if (
      trimmed.startsWith('<h') ||
      trimmed.startsWith('<pre') ||
      trimmed.startsWith('<blockquote') ||
      trimmed.startsWith('<ul') ||
      trimmed.startsWith('<ol') ||
      trimmed.startsWith('<img') ||
      trimmed.startsWith('<div') ||
      trimmed.startsWith('<hr') ||
      trimmed.startsWith('__CODE_BLOCK_')
    ) {
      return trimmed;
    }
    return `<p class="leading-relaxed mb-4 text-zinc-605 dark:text-zinc-300 font-medium">${trimmed}</p>`;
  });

  let result = paragraphs.join('\n');

  // Restore Code Blocks from placeholders
  codeBlocks.forEach((codeBlockHtml, idx) => {
    result = result.replace(`__CODE_BLOCK_${idx}__`, codeBlockHtml);
  });

  return result;
}

export function extractHeadings(markdownInput) {
  if (!markdownInput) return [];
  
  // If it already looks like Quill HTML content, parse HTML headings
  if (
    markdownInput.includes('<p>') ||
    markdownInput.includes('<h1>') ||
    markdownInput.includes('<ul>') ||
    markdownInput.includes('<strong>') ||
    markdownInput.includes('href=')
  ) {
    const headings = [];
    const regex = /<h([1-5])\s*(?:id="([^"]+)")?[^>]*>(.*?)<\/h\1>/g;
    let match;
    let idx = 0;
    while ((match = regex.exec(markdownInput)) !== null) {
      const rawLevel = parseInt(match[1]);
      const level = rawLevel === 1 ? 1 : rawLevel - 1;
      const text = match[3].replace(/<\/?[^>]+(>|$)/g, ""); // strip inner tags
      const id = match[2] || `heading-${idx}-${text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`;
      if (level <= 3) {
        headings.push({ id, text, level });
      }
      idx++;
    }
    return headings;
  }

  // Strip code blocks first to match parseMarkdown logic
  const cleanMarkdown = markdownInput.replace(/```[\s\S]*?```/g, '');

  const headings = [];
  const lines = cleanMarkdown.split('\n');
  let headingCounter = 0;
  
  for (let line of lines) {
    const trimmed = line.trim();
    const match = trimmed.match(/^(#{1,4})\s+(.*?)$/);
    if (match) {
      const level = match[1].length;
      const text = match[2].trim();
      const slug = text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      const id = `heading-${headingCounter++}-${slug}`;
      if (level <= 3) {
        headings.push({ id, text, level });
      }
    }
  }
  
  return headings;
}
