/**
 * Markdown Utilities - Re-exports from markdownEngine with backward compatibility.
 */
import { parseMarkdownToHtml, extractHeadings as extractHeadingsEngine, slugify, sanitizeHtml } from './markdownEngine';

export function parseMarkdown(markdownInput) {
  return parseMarkdownToHtml(markdownInput);
}

export function extractHeadings(markdownInput) {
  return extractHeadingsEngine(markdownInput);
}

export { slugify, sanitizeHtml };
export default parseMarkdown;
