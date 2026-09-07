import { parseMarkdownToHtml, extractHeadings, isRTL } from '../src/utils/markdownEngine.js';

console.log('======================================================================');
console.log('TECHYBLOGS — WORLD-CLASS MARKDOWN CONFORMANCE & STRESS BENCHMARK SUITE');
console.log('======================================================================\n');

let passCount = 0;
let failCount = 0;

function assert(condition, testName, detail = '') {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passCount++;
  } else {
    console.error(`  ❌ FAIL: ${testName}${detail ? ` — ${detail}` : ''}`);
    failCount++;
  }
}

// -----------------------------------------------------------------------------
// SUITE 1: CommonMark & GFM Syntax Conformance
// -----------------------------------------------------------------------------
console.log('>>> SUITE 1: CommonMark & GFM Conformance');

const gfmDoc = `
# Main Header

## Second Header with *Italics* & **Bold**

A regular paragraph with ~~strikethrough~~, \`inline code\`, and a [link](https://techyblogs.com "TechyBlogs").

| Column A | Column B | Column C |
| :--- | :---: | ---: |
| Left aligned | Center aligned | Right aligned |
| Data 1 | Data 2 | Data 3 |

* Item 1
  * Nested item 1.1
    * Deep item 1.1.1
* Item 2

- [ ] Pending task
- [x] Completed task

> A profound blockquote for editorial wisdom.

![Scenic Kashmir](https://images.unsplash.com/photo-1595815771614-ade9d652a65d "The pristine valleys of Srinagar")
`;

const parsedGfm = parseMarkdownToHtml(gfmDoc);
const extractedH = extractHeadings(gfmDoc);

assert(parsedGfm.includes('<h1 id="heading-0-main-header"'), 'H1 generated with deterministic slug anchor');
assert(parsedGfm.includes('id="heading-1-second-header-with-italics-and-bold"'), 'H2 with formatting stripped and entity converted in slug');
assert(extractedH.length === 2, 'Headings extraction matches document structure');
assert(parsedGfm.includes('<table class="gfm-table">'), 'GFM table rendered with custom table class');
assert(parsedGfm.includes('style="text-align: center"'), 'GFM table column alignments preserved');
assert(parsedGfm.includes('<del>strikethrough</del>') || parsedGfm.includes('<s>strikethrough</s>'), 'Strikethrough formatting parsed');
assert(parsedGfm.includes('<li class="task-list-item"><input type="checkbox" disabled />'), 'Pending task list checkbox parsed');
assert(parsedGfm.includes('<li class="task-list-item"><input type="checkbox" disabled checked />'), 'Completed task list checkbox parsed');
assert(parsedGfm.includes('<figure class="article-figure">') && parsedGfm.includes('<figcaption'), 'Image transformed into semantic figure with figcaption');

// -----------------------------------------------------------------------------
// SUITE 2: KaTeX Mathematical Typesetting
// -----------------------------------------------------------------------------
console.log('\n>>> SUITE 2: KaTeX Mathematical Typesetting');

const mathDoc = `
Inline equation: $E = mc^2$ and Euler's formula $e^{i\\pi} + 1 = 0$.

Display equation:
$$
\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}
$$

Matrix calculation:
$$
\\mathbf{A} = \\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}
$$

Currency is not math: The price is $50 or $10.99 for annual subscriptions.
`;

const parsedMath = parseMarkdownToHtml(mathDoc);

assert(parsedMath.includes('class="katex"') && parsedMath.includes('>E<'), 'Inline KaTeX formula rendered to MathML/HTML');
assert(parsedMath.includes('katex-display-wrapper') && parsedMath.includes('dir="ltr"'), 'Display KaTeX formula wrapped in strictly LTR display container');
assert(parsedMath.includes('$50') && parsedMath.includes('$10.99'), 'Currency values ($50, $10.99) are safely excluded from math compilation');

// -----------------------------------------------------------------------------
// SUITE 3: Mermaid Diagrams
// -----------------------------------------------------------------------------
console.log('\n>>> SUITE 3: Mermaid Diagrams');

const mermaidDoc = `
\`\`\`mermaid
graph TD
    A[Client Request] --> B[Edge CDN]
    B --> C{Cache Hit?}
    C -->|Yes| D[200 OK]
    C -->|No| E[Origin Server]
\`\`\`
`;

const parsedMermaid = parseMarkdownToHtml(mermaidDoc);

assert(parsedMermaid.includes('class="mermaid-container') && parsedMermaid.includes('data-mermaid="graph%20TD'), 'Mermaid block parsed into interactive container with URL-encoded payload');
assert(parsedMermaid.includes('dir="ltr"'), 'Mermaid container pinned to strictly LTR orientation');

// -----------------------------------------------------------------------------
// SUITE 4: Editorial Callouts & Admonitions
// -----------------------------------------------------------------------------
console.log('\n>>> SUITE 4: Editorial Callouts & Admonitions');

const calloutDoc = `
:::note Architecture Guideline
State separation ensures optimal performance.
:::

:::tip Pro Tip
Use edge functions for fast geolocated content delivery.
:::

:::warning Deprecation Alert
Legacy endpoints will be decommissioned in Q4.
:::

:::important Critical Security
Always validate inputs both client and server side.
:::
`;

const parsedCallout = parseMarkdownToHtml(calloutDoc);

assert(parsedCallout.includes('callout-block callout-note') && parsedCallout.includes('Architecture Guideline'), 'Note callout rendered with title and block class');
assert(parsedCallout.includes('callout-block callout-tip') && parsedCallout.includes('Pro Tip'), 'Tip callout rendered with title');
assert(parsedCallout.includes('callout-block callout-warning'), 'Warning callout rendered');
assert(parsedCallout.includes('callout-block callout-important'), 'Important callout rendered');

// -----------------------------------------------------------------------------
// SUITE 5: Interactive Quizzes
// -----------------------------------------------------------------------------
console.log('\n>>> SUITE 5: Interactive Quizzes');

const quizDoc = `
:::quiz
question: What is the main advantage of Server Components in React 19?
options:
- Zero bundle size on the client for static components
- Automatic CSS rewriting
- Built-in SQL database
answer: 0
:::
`;

const parsedQuiz = parseMarkdownToHtml(quizDoc);

assert(parsedQuiz.includes('class="interactive-quiz-container') && parsedQuiz.includes('data-answer="0"'), 'Interactive quiz block parsed with question and correct answer index');

// -----------------------------------------------------------------------------
// SUITE 6: Fence-Aware Escaping & Round-Trip Code Protection
// -----------------------------------------------------------------------------
console.log('\n>>> SUITE 6: Fence-Aware Escaping & Code Protection');

const fenceDoc = `
Here is an example of a callout inside a tutorial:

\`\`\`markdown
:::note Example Callout Inside Code
This should NOT become a real callout block.
:::
\`\`\`

Here is an example of math inside code:

\`\`\`latex
$$
\\int_0^1 f(x)dx
$$
\`\`\`

Here is inline code with dollar signs: \`$variable = "$value";\`.
`;

const parsedFence = parseMarkdownToHtml(fenceDoc);

assert(parsedFence.includes('&gt;Example Callout Inside Code') || parsedFence.includes(':::note Example Callout Inside Code'), 'Callout inside code fence is preserved as code and NOT transformed into a callout container');
assert(parsedFence.includes('&gt;\\int_0^1') || parsedFence.includes('\\int_0^1 f(x)dx'), 'Math inside code fence is preserved as code and NOT transformed into KaTeX');
assert(parsedFence.includes('<code>$variable = "$value";</code>') || parsedFence.includes('<code>$variable = &quot;$value&quot;;</code>'), 'Inline code with dollars is preserved and NOT corrupted into math');

// -----------------------------------------------------------------------------
// SUITE 7: Multilingual & RTL Support
// -----------------------------------------------------------------------------
console.log('\n>>> SUITE 7: Multilingual & RTL Support');

const urduDoc = `
# کشمیر کی ثقافت اور تاریخ

کشمیر کا خطہ اپنی بے مثال قدرتی خوبصورتی اور صدیوں پرانی ثقافتی روایات کے لیے دنیا بھر میں مشہور ہے۔

\`\`\`python
# Code snippet inside Urdu article
def calculate_area(radius):
    import math
    return math.pi * radius ** 2
\`\`\`
`;

const parsedUrdu = parseMarkdownToHtml(urduDoc);

assert(isRTL('کشمیر کا خطہ اپنی بے مثال قدرتی خوبصورتی کے لیے مشہور ہے'), 'RTL helper detects Urdu / Arabic text correctly');
assert(!isRTL('The quick brown fox jumps over the lazy dog'), 'RTL helper correctly detects LTR English text');
assert(parsedUrdu.includes('dir="rtl"'), 'Urdu paragraph and heading are tagged with dir="rtl"');
assert(parsedUrdu.includes('<pre class="hljs-code-block') && parsedUrdu.includes('dir="ltr"'), 'Code blocks in RTL articles remain strictly dir="ltr"');

// -----------------------------------------------------------------------------
// SUITE 8: Security & Industrial XSS Sanitization
// -----------------------------------------------------------------------------
console.log('\n>>> SUITE 8: Security & Industrial XSS Sanitization');

const maliciousDoc = `
# Normal Title

<script>alert("XSS Script Execution")</script>
<img src="nonexistent.jpg" onerror="alert('XSS Image Error')" />
<iframe src="https://evil.com"></iframe>
<object data="malicious.swf"></object>
<embed src="malicious.swf">
<a href="javascript:alert('XSS Link')">Dangerous Link</a>
<a href="data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==">Data URI Link</a>
<a href="vbscript:msgbox('XSS')">VBScript Link</a>
`;

const parsedMalicious = parseMarkdownToHtml(maliciousDoc);

assert(!parsedMalicious.includes('<script'), 'Malicious <script> tags removed');
assert(!parsedMalicious.includes('onerror='), 'Malicious onerror attributes removed');
assert(!parsedMalicious.includes('<iframe'), 'Malicious <iframe> tags removed');
assert(!parsedMalicious.includes('<object'), 'Malicious <object> tags removed');
assert(!parsedMalicious.includes('<embed'), 'Malicious <embed> tags removed');
assert(!parsedMalicious.includes('javascript:'), 'Dangerous javascript: URI schemes disarmed');
assert(!parsedMalicious.includes('data:text/html'), 'Dangerous data: URI schemes disarmed');
assert(!parsedMalicious.includes('vbscript:'), 'Dangerous vbscript: URI schemes disarmed');

// -----------------------------------------------------------------------------
// SUITE 9: 50,000-Word Performance Stress Benchmark
// -----------------------------------------------------------------------------
console.log('\n>>> SUITE 9: 50,000-Word Performance Stress Benchmark');

let massiveDoc = '# Comprehensive 50,000-Word Technical Specification\n\n';
const paragraphTemplate = `
In modern cloud architectures, achieving sub-millisecond response latency requires careful synchronization between edge CDN caches, distributed database clusters, and streaming server components. When a user requests a dynamic page, the edge node validates cache headers, queries the localized database replica, and streams compressed HTML chunks to the browser client with zero blocking time.

\`\`\`typescript
interface EdgeConfig {
  region: string;
  cacheTtlSeconds: number;
  retryAttempts: number;
  encryptionEnabled: boolean;
}

export function configureEdgePipeline(config: EdgeConfig): Promise<boolean> {
  console.log("Edge pipeline configured for region:", config.region);
  return Promise.resolve(true);
}
\`\`\`

$$
\\mathcal{L}(\\theta) = -\\sum_{i=1}^{N} y_i \\log(\\hat{y}_i) + (1 - y_i) \\log(1 - \\hat{y}_i) + \\lambda \\|\\theta\\|^2
$$

:::note Benchmark Marker
Performance invariant under high concurrency and deep AST nesting.
:::

`;

// Generate a 50,000-word realistic technical document
for (let i = 0; i < 500; i++) {
  massiveDoc += `## Section ${i + 1}: Architectural Pipeline Specification\n\n` + paragraphTemplate;
}

const totalWords = massiveDoc.trim().split(/\s+/).length;
console.log(`  Generated stress document containing ${totalWords.toLocaleString()} words.`);

const startTime = performance.now();
const parsedMassiveHtml = parseMarkdownToHtml(massiveDoc);
const endTime = performance.now();
const durationMs = (endTime - startTime).toFixed(2);

console.log(`  Parsing 50,000-word document took: ${durationMs}ms`);
assert(parsedMassiveHtml.length > 500000, 'Massive document generated complete HTML production output');
assert(parseFloat(durationMs) < 250, `Parse time (${durationMs}ms) is well under 250ms SLA for 50,000 words`);

// -----------------------------------------------------------------------------
// FINAL SUMMARY
// -----------------------------------------------------------------------------
console.log('\n======================================================================');
console.log(`CONFORMANCE TEST RESULTS: ${passCount} PASSED, ${failCount} FAILED`);
console.log('======================================================================\n');

if (failCount > 0) {
  process.exit(1);
}
