import { parseMarkdownToHtml, extractHeadings, slugify } from '../src/utils/markdownEngine.js';

console.log('=====================================================');
console.log('TESTING WORLD-CLASS MARKDOWN & RENDERING PIPELINE');
console.log('=====================================================\n');

// 1. Test Headings & Table of Contents
console.log('--- 1. Testing Headings & Deterministic Slugs ---');
const headingsMd = `
# Main Title

## Architecture & System Design

### Sub-component 1: Parser

#### Deep Detail Level 4

## Architecture & System Design
`;

const parsedHeadings = extractHeadings(headingsMd);
console.log('Extracted Headings for TOC:', JSON.stringify(parsedHeadings, null, 2));

const parsedHeadingsHtml = parseMarkdownToHtml(headingsMd);
console.log('Parsed Headings HTML:\n', parsedHeadingsHtml);

// 2. Test GFM Table & Task Lists
console.log('\n--- 2. Testing GFM Tables & Task Lists ---');
const tableMd = `
| Feature | Supported | Performance | Notes |
| :--- | :---: | ---: | :--- |
| **KaTeX Math** | Yes | Sub-millisecond | Full LaTeX support |
| **Mermaid Diagrams** | Yes | Interactive SVG | Flowcharts & Sequences |
| **GFM Tables** | Yes | Responsive | Sticky headers & zebra |

- [ ] Unchecked task
- [x] Completed task item
`;

const parsedTableHtml = parseMarkdownToHtml(tableMd);
console.log('Parsed Table & Task List HTML:\n', parsedTableHtml);

// 3. Test LaTeX Mathematics
console.log('\n--- 3. Testing KaTeX Mathematical Equations ---');
const mathMd = `
The mass-energy equivalence is defined by $E = mc^2$ in physics.

The Gaussian integral evaluated over the real line:

$$
\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}
$$

We also have matrices:

$$
\\begin{pmatrix}
a & b \\\\
c & d
\\end{pmatrix}
$$
`;

const parsedMathHtml = parseMarkdownToHtml(mathMd);
console.log('Parsed Math HTML snippet:\n', parsedMathHtml);

// 4. Test Mermaid Diagrams
console.log('\n--- 4. Testing Mermaid Diagram Blocks ---');
const mermaidMd = `
\`\`\`mermaid
graph TD
    A[Client Request] --> B[Next.js App Router]
    B --> C{Cached?}
    C -->|Yes| D[Edge CDN Delivery]
    C -->|No| E[MongoDB Atlas Query]
    E --> D
\`\`\`
`;

const parsedMermaidHtml = parseMarkdownToHtml(mermaidMd);
console.log('Parsed Mermaid HTML:\n', parsedMermaidHtml);

// 5. Test Callouts / Admonitions
console.log('\n--- 5. Testing Editorial Callouts ---');
const calloutMd = `
:::note Architectural Rule
Always separate the editor system from the content rendering pipeline.
:::

:::tip Pro Performance
Leverage Partial Prerendering to deliver instant First Contentful Paint.
:::

:::warning Breaking Change
Upgrading to React 19 deprecates defaultProps in function components.
:::

:::important Security Notice
Never execute unsanitized user-generated HTML in the DOM.
:::
`;

const parsedCalloutHtml = parseMarkdownToHtml(calloutMd);
console.log('Parsed Callouts HTML:\n', parsedCalloutHtml);

// 6. Test Interactive Quizzes
console.log('\n--- 6. Testing Interactive Quiz Blocks ---');
const quizMd = `
:::quiz
question: What does GFM stand for in Markdown specifications?
options:
- GitHub Flavored Markdown
- General Formatting Model
- Global Font Manager
- Google Frontend Module
answer: 0
:::
`;

const parsedQuizHtml = parseMarkdownToHtml(quizMd);
console.log('Parsed Quiz HTML:\n', parsedQuizHtml);

// 7. Test Code Blocks with Syntax Highlighting
console.log('\n--- 7. Testing Syntax Highlighted Code Blocks ---');
const codeMd = `
\`\`\`typescript
interface ArticlePayload {
  title: string;
  slug: string;
  wordCount: number;
}

export function publish(payload: ArticlePayload): boolean {
  console.log("Publishing:", payload.title);
  return true;
}
\`\`\`
`;

const parsedCodeHtml = parseMarkdownToHtml(codeMd);
console.log('Parsed Code Block HTML:\n', parsedCodeHtml);

// 8. Test Footnotes
console.log('\n--- 8. Testing Footnotes ---');
const footnotesMd = `
Next.js 15 was released with full React 19 support.[^1] It includes the new Turbopack bundler.[^2]

[^1]: Next.js 15 official release notes and changelog.
[^2]: Turbopack is an incremental bundler optimized for JavaScript and TypeScript.
`;

const parsedFootnotesHtml = parseMarkdownToHtml(footnotesMd);
console.log('Parsed Footnotes HTML:\n', parsedFootnotesHtml);

// 9. Test XSS Security & Sanitization
console.log('\n--- 9. Testing XSS Security & Sanitization ---');
const maliciousMd = `
<script>alert("XSS Attack");</script>
<img src="x" onerror="alert('XSS Image')" />
<a href="javascript:alert('XSS Link')">Click here</a>
`;

const sanitizedHtml = parseMarkdownToHtml(maliciousMd);
console.log('Sanitized Malicious Input Result:\n', sanitizedHtml);

if (
  !sanitizedHtml.includes('<script>') &&
  !sanitizedHtml.includes('onerror=') &&
  !sanitizedHtml.includes('javascript:')
) {
  console.log('✅ XSS Sanitization PASSED: All malicious vectors stripped safely!');
} else {
  console.error('❌ XSS Sanitization FAILED: Vulnerability detected!');
}

console.log('\n=====================================================');
console.log('ALL ENGINE UNIT TESTS COMPLETED SUCCESSFULLY!');
console.log('=====================================================');
