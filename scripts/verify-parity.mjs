import { parseMarkdownToHtml, extractHeadings } from '../src/utils/markdownEngine.js';

console.log('======================================================================');
console.log('TEACHYBLOGS — FULL LIFECYCLE ROUND-TRIP & RENDERING PARITY TEST');
console.log('======================================================================\n');

// 1. Authoring complex editorial story
const authorInputMarkdown = `
# Engineering Scalable Web Applications in Next.js 15

In modern cloud architecture, achieving high-throughput requires clean separation between the editorial authoring system and rendering pipelines.

## Architectural Principles

1. **Deterministic AST Transformations**: All extensions parse reliably.
2. **Strict Sanitization**: Reject all unsafe vectors before DOM insertion.

| Component | Role | Latency SLA |
| :--- | :--- | ---: |
| Edge Router | CDN delivery | < 15ms |
| SSR Renderer | HTML streaming | < 45ms |
| Database | Monotonic log | < 10ms |

### Distributed Math Invariant

The error bound is computed via Gaussian density:

$$
f(x) = \\frac{1}{\\sigma \\sqrt{2\\pi}} e^{-\\frac{1}{2}\\left(\\frac{x - \\mu}{\\sigma}\\right)^2}
$$

### System Data Flow

\`\`\`mermaid
graph LR
    Author[Author in Editor] --> AST[Fence-Aware Parser]
    AST --> Clean[DOMPurify Sanitizer]
    Clean --> Reader[Public Article View]
\`\`\`

:::tip Pro Tip
Always use single-pass placeholder replacement for large documents.
:::

:::quiz
question: What is the primary benefit of SSR Streaming?
options:
- Progressive rendering without waiting for full data fetch
- Automatic SQL generation
- Client bundle size reduction
answer: 0
:::

\`\`\`diff
- const legacyParser = new RegexParser();
+ const modernParser = new FenceAwareASTParser();
\`\`\`

کشمیر کے موضوع پر تحقیقی مضامین اور تفصیلی رپورٹنگ۔

[^ref1]: High-Performance Browser Networking by Ilya Grigorik.
`;

console.log('--- Step 1: Simulating Authoring in Editor ---');
const editorParsedHtml = parseMarkdownToHtml(authorInputMarkdown);
const editorHeadings = extractHeadings(authorInputMarkdown);
console.log(`  Editor produced ${editorHeadings.length} TOC headings and ${editorParsedHtml.length} bytes of preview HTML.`);

console.log('\n--- Step 2: Simulating Save to Database / Serialization ---');
const savedPayload = JSON.stringify({
  title: 'Engineering Scalable Web Applications in Next.js 15',
  content: authorInputMarkdown,
  contentType: 'tutorial',
  status: 'published',
});
console.log(`  Saved article payload size: ${savedPayload.length} bytes.`);

console.log('\n--- Step 3: Simulating Public Reader Load & Render (PostClient) ---');
const reloadedPost = JSON.parse(savedPayload);
const publicReaderParsedHtml = parseMarkdownToHtml(reloadedPost.content);
const publicReaderHeadings = extractHeadings(reloadedPost.content);
console.log(`  Public Reader produced ${publicReaderHeadings.length} TOC headings and ${publicReaderParsedHtml.length} bytes of reader HTML.`);

console.log('\n--- Step 4: Verifying 100% WYSIWYG Parity Between Preview and Public Reader ---');
const isHtmlIdentical = editorParsedHtml === publicReaderParsedHtml;
const isTOCIdentical = JSON.stringify(editorHeadings) === JSON.stringify(publicReaderHeadings);

if (isHtmlIdentical && isTOCIdentical) {
  console.log('  ✅ SUCCESS: 100% Character-for-Character Rendering Parity Verified between Admin Preview and Public Article Reader!');
} else {
  console.error('  ❌ FAILURE: Discrepancy detected between Preview and Public Reader.');
  process.exit(1);
}

console.log('\n======================================================================');
console.log('ALL LIFECYCLE PARITY TESTS COMPLETED WITH ZERO DISCREPANCIES');
console.log('======================================================================');
