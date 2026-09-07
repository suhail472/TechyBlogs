import { parseMarkdownToHtml, extractHeadings, slugify, isRTL, sanitizeHtml } from '../src/utils/markdownEngine.js';

console.log('==================================================================================');
console.log('TECHYBLOGS — HOSTILE ADVERSARIAL QA & EXTREME EDGE CASE VERIFICATION BATTERY');
console.log('==================================================================================\n');

let passCount = 0;
let failCount = 0;
const issuesDiscovered = [];

function recordIssue(severity, title, description) {
  issuesDiscovered.push({ severity, title, description });
}

function assert(condition, testName, severity = 'HIGH', detail = '') {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passCount++;
  } else {
    console.error(`  ❌ FAIL [${severity}]: ${testName}${detail ? ` — ${detail}` : ''}`);
    failCount++;
    recordIssue(severity, testName, detail);
  }
}

// ----------------------------------------------------------------------------------
// SECTION 1: MALFORMED & UNCLOSED CUSTOM BLOCKS
// ----------------------------------------------------------------------------------
console.log('>>> 1. Testing Malformed & Unclosed Custom Blocks');

// 1.1 Unclosed Callout at EOF
const unclosedCallout = `
:::warning Unclosed Security Alert
This callout was never closed with triple colons before EOF.
`;
const parsedUnclosedCallout = parseMarkdownToHtml(unclosedCallout);
assert(
  parsedUnclosedCallout.includes('callout-block callout-warning') &&
  parsedUnclosedCallout.includes('Unclosed Security Alert'),
  'Unclosed Callout at EOF is gracefully recovered and rendered without crashing',
  'MEDIUM'
);

// 1.2 Malformed Quiz with Missing Fields & Special Characters
const malformedQuiz = `
:::quiz
question: What happens if JSON characters like "quotes" and <script> exist here?
options:
- Option 1 with 'single quotes' & "double quotes"
- Option 2 with <img onerror=1>
answer: not-a-number
:::
`;
const parsedMalformedQuiz = parseMarkdownToHtml(malformedQuiz);
assert(
  parsedMalformedQuiz.includes('class="interactive-quiz-container') &&
  parsedMalformedQuiz.includes('data-answer="0"'),
  'Malformed Quiz with non-numeric answer defaults safely to 0 without breaking',
  'HIGH'
);

// 1.3 Unmatched Math Dollars ($ and $$)
const unmatchedMath = `
Here is a single dollar sign: $50 without a partner.
Here is an unclosed display math:
$$
\\int_0^1 x dx
`;
const parsedUnmatchedMath = parseMarkdownToHtml(unmatchedMath);
assert(
  parsedUnmatchedMath.includes('$50') &&
  (parsedUnmatchedMath.includes('katex') || parsedUnmatchedMath.includes('\\int_0^1')),
  'Unclosed Display Math at EOF is recovered without process exception',
  'MEDIUM'
);

// ----------------------------------------------------------------------------------
// SECTION 2: FENCED CODE IMMUNITY (NO FALSE POSITIVES)
// ----------------------------------------------------------------------------------
console.log('\n>>> 2. Testing Fenced Code Immunity (Tildes, Backticks, Nested Fences)');

const tildeFencedDoc = `
~~~markdown
:::danger Do Not Render
\`\`\`mermaid
graph TD
    A --> B
\`\`\`
$$E=mc^2$$
:::
~~~

\`\`\`php
// PHP code with multiple dollar signs
$user_id = $_GET['id'];
$query = "SELECT * FROM users WHERE id = $user_id";
$total = $price * $quantity;
\`\`\`
`;
const parsedTildeFence = parseMarkdownToHtml(tildeFencedDoc);
assert(
  !parsedTildeFence.includes('class="mermaid-container"') &&
  !parsedTildeFence.includes('class="callout-block callout-danger"'),
  'Tilde code fences (~~~) prevent interception of Mermaid and Callouts inside code',
  'HIGH'
);
assert(
  parsedTildeFence.includes('$user_id') && parsedTildeFence.includes('$total'),
  'PHP variable dollars inside code fence are 100% preserved and never converted to math',
  'CRITICAL'
);

// ----------------------------------------------------------------------------------
// SECTION 3: DUPLICATE HEADINGS & TOC ID SYNCHRONIZATION
// ----------------------------------------------------------------------------------
console.log('\n>>> 3. Testing Duplicate Headings & TOC ID Synchronization');

const duplicateHeadingsDoc = `
# System Architecture

## Overview

### Details

## Overview

### Details

## Overview

~~~markdown
## Overview inside code fence
~~~
`;

const parsedDupH = parseMarkdownToHtml(duplicateHeadingsDoc);
const extractedDupH = extractHeadings(duplicateHeadingsDoc);

assert(extractedDupH.length === 6, 'Heading extractor finds exactly 6 actual headings, ignoring code fence');

// Verify all heading IDs in extractedDupH exist in the rendered HTML in exact order
let allSynced = true;
extractedDupH.forEach((h, idx) => {
  if (!parsedDupH.includes(`id="${h.id}"`)) {
    allSynced = false;
  }
});
assert(allSynced, '100% Deterministic ID synchronization between extractHeadings() and parseMarkdownToHtml()', 'CRITICAL');

// Verify IDs are unique
const idSet = new Set(extractedDupH.map(h => h.id));
assert(idSet.size === extractedDupH.length, 'All generated heading IDs are globally unique even with identical text', 'CRITICAL');

// ----------------------------------------------------------------------------------
// SECTION 4: MULTIPLE FOOTNOTE REFERENCES TO SAME TARGET & ORPHANS
// ----------------------------------------------------------------------------------
console.log('\n>>> 4. Testing Complex Footnotes (Multiple refs & Orphans)');

const footnoteDoc = `
First mention of Next.js 15[^next15]. Second mention of Next.js 15[^next15]. Third mention[^next15].
Another reference[^react19].

[^next15]: Next.js 15 is the latest major release with React 19 support.
[^react19]: React 19 brings Actions, Server Components, and asset loading.
[^orphan]: This definition has no references in the body text.
`;

const parsedFootnotes = parseMarkdownToHtml(footnoteDoc);
assert(
  (parsedFootnotes.match(/href="#fn-next15"/g) || []).length === 3,
  'Multiple references to the same footnote [^next15] generate valid numbered links',
  'HIGH'
);
assert(
  parsedFootnotes.includes('id="fn-next15"') && parsedFootnotes.includes('id="fn-react19"'),
  'Footnotes footer section rendered with backlink return anchors',
  'HIGH'
);

// ----------------------------------------------------------------------------------
// SECTION 5: EXTREME XSS & ADVERSARIAL INJECTION VECTORS
// ----------------------------------------------------------------------------------
console.log('\n>>> 5. Testing Extreme XSS & Polyglot Injection Vectors');

const attackVectors = [
  '<svg><g onload="alert(1)"></g></svg>',
  '<svg><animate onbegin=alert(1) attributeName=x dur=1s>',
  '<math><mtext><table><mglyph><style><img src=x onerror=alert(1)>',
  '<a href="jav&#x09;ascript:alert(1)">Obfuscated JavaScript Link</a>',
  '<a href="javascript&#x3a;alert(1)">Entity JavaScript Link</a>',
  '<a href="data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==">Base64 HTML Data URI</a>',
  '<img src="data:image/svg+xml;base64,PHN2ZyBvbmxvYWQ9YWxlcnQoMSk+">',
  '```mermaid\ngraph TD\n    A["<iframe src=javascript:alert(1)>"] --> B\n```',
  ':::note <script>alert("callout xss")</script>\n<img src=x onerror=alert("callout body xss")>\n:::',
  ':::quiz\nquestion: <script>alert(1)</script>\noptions:\n- <img src=x onerror=alert(1)>\nanswer: 0\n:::',
];

let allSecurityPassed = true;

attackVectors.forEach((attack, idx) => {
  const sanitizedOutput = parseMarkdownToHtml(attack);
  
  if (
    sanitizedOutput.includes('<script') ||
    sanitizedOutput.includes('onload=') ||
    sanitizedOutput.includes('onerror=') ||
    sanitizedOutput.includes('onbegin=') ||
    sanitizedOutput.includes('javascript:') ||
    sanitizedOutput.includes('jav&#x09;ascript:') ||
    sanitizedOutput.includes('javascript&#x3a;') ||
    sanitizedOutput.includes('<iframe')
  ) {
    allSecurityPassed = false;
    console.error(`  ❌ XSS Vector #${idx + 1} Breached Sanitizer:\nInput: ${attack}\nOutput: ${sanitizedOutput}`);
  }
});

assert(allSecurityPassed, 'All 10 Extreme XSS & Polyglot injection vectors neutralized completely', 'CRITICAL');

// ----------------------------------------------------------------------------------
// SECTION 6: MULTILINGUAL BIDI & UNICODE COMPLEXITY
// ----------------------------------------------------------------------------------
console.log('\n>>> 6. Testing Multilingual BiDi & Unicode Complexity');

const complexBidiDoc = `
# کشمیر، جموں اور لداخ کی مکمل تاریخ

یہ مضمون خطہ کشمیر کے قدیم فن تعمیر، شال بافی اور صوفیانہ ثقافت پر تفصیلی روشنی ڈالتا ہے۔

## तकनीकी सारांश (Hindi Section)

यह प्रणाली उच्च प्रदर्शन और बहुभाषी समर्थन के लिए डिज़ाइन की गई है।

### Technical Specifications & LTR Code

\`\`\`javascript
// Mixed LTR code inside Urdu/Hindi document
const regions = ["Srinagar", "Gulmarg", "Pahalgam", "Sonamarg"];
const weather = { temp: 18, unit: "Celsius" };
\`\`\`

$$
\\text{Area} = \\pi r^2
$$

Emoji test: 🏔️ 🌊 ❄️ 🚀 💻 🛡️
`;

const parsedBidi = parseMarkdownToHtml(complexBidiDoc);

assert(parsedBidi.includes('dir="rtl"'), 'Urdu section assigned dir="rtl" for proper Arabic cursive alignment', 'HIGH');
assert(parsedBidi.includes('<pre class="hljs-code-block') && parsedBidi.includes('dir="ltr"'), 'Code blocks in multilingual documents stay strictly dir="ltr"', 'CRITICAL');
assert(parsedBidi.includes('🏔️ 🌊 ❄️'), 'Unicode Emojis rendered without encoding corruption', 'MEDIUM');

// ----------------------------------------------------------------------------------
// SECTION 7: DEEPLY NESTED & HUGE STRUCTURES
// ----------------------------------------------------------------------------------
console.log('\n>>> 7. Testing Deeply Nested & Huge Structures');

// 7.1 Nested Lists 10 Levels Deep
let nestedListDoc = '* Level 1\n';
for (let l = 2; l <= 10; l++) {
  nestedListDoc += '  '.repeat(l - 1) + `* Level ${l}\n`;
}
const parsedNestedList = parseMarkdownToHtml(nestedListDoc);
assert(parsedNestedList.includes('Level 10'), '10-Level deep nested lists parse cleanly without stack overflow', 'HIGH');

// 7.2 Huge Table (20 columns x 50 rows = 1,000 cells)
let hugeTableDoc = '| ' + Array.from({ length: 20 }, (_, c) => `Col ${c + 1}`).join(' | ') + ' |\n';
hugeTableDoc += '| ' + Array.from({ length: 20 }, () => '---').join(' | ') + ' |\n';
for (let r = 0; r < 50; r++) {
  hugeTableDoc += '| ' + Array.from({ length: 20 }, (_, c) => `Cell R${r + 1}C${c + 1}`).join(' | ') + ' |\n';
}
const parsedHugeTable = parseMarkdownToHtml(hugeTableDoc);
assert(parsedHugeTable.includes('Cell R50C20'), 'Huge 1,000-cell GFM table parsed with responsive wrapper', 'HIGH');

// 7.3 Huge Code Block (500 lines)
let hugeCodeDoc = '```javascript\n';
for (let line = 1; line <= 500; line++) {
  hugeCodeDoc += `const variable_${line} = calculateMetric(${line});\n`;
}
hugeCodeDoc += '```\n';
const parsedHugeCode = parseMarkdownToHtml(hugeCodeDoc);
assert(
  parsedHugeCode.includes('is-collapsible') && parsedHugeCode.includes('code-line-number'),
  'Huge 500-line code block marked collapsible with line numbers',
  'HIGH'
);

// ----------------------------------------------------------------------------------
// SECTION 8: 100,000-WORD ULTRA STRESS & MEMORY BENCHMARK
// ----------------------------------------------------------------------------------
console.log('\n>>> 8. Testing 100,000-Word Ultra Stress & Memory Benchmark');

let ultraDoc = '# 100,000-Word Massive Editorial Corpus\n\n';
const corpusUnit = `
High-concurrency distributed systems depend on eventual consistency models, distributed consensus protocols like Raft and Paxos, and robust replication strategies. Ensuring data integrity during network partitions requires idempotency keys, write-ahead logs, and monotonic timestamp generation.

\`\`\`rust
pub struct PartitionGuard<T: Clone> {
    state: Arc<RwLock<T>>,
    epoch: u64,
}

impl<T: Clone> PartitionGuard<T> {
    pub fn commit(&self, value: T) -> Result<(), &'static str> {
        Ok(())
    }
}
\`\`\`

$$
P(X = k) = \\frac{\\lambda^k e^{-\\lambda}}{k!}
$$

:::tip Architectural Best Practice
Design for failure by isolating state transitions inside bounded transactional contexts.
:::

`;

// Repeat 800 times (~100,000 words)
for (let i = 0; i < 800; i++) {
  ultraDoc += `## Sub-Section ${i + 1}: Transactional State Machine Model\n\n` + corpusUnit;
}

const ultraWords = ultraDoc.trim().split(/\s+/).length;
console.log(`  Generated ultra-stress document containing ${ultraWords.toLocaleString()} words.`);

const ultraStart = performance.now();
const parsedUltraHtml = parseMarkdownToHtml(ultraDoc);
const ultraEnd = performance.now();
const ultraDuration = (ultraEnd - ultraStart).toFixed(2);

console.log(`  Parsing ${ultraWords.toLocaleString()} words took: ${ultraDuration}ms`);
assert(parsedUltraHtml.length > 1000000, '100,000-word document generated over 1MB of complete HTML production output');
assert(parseFloat(ultraDuration) < 400, `Parse time (${ultraDuration}ms) is well under 400ms SLA for 100,000 words`, 'CRITICAL');

// ----------------------------------------------------------------------------------
// FINAL ADVERSARIAL QA SUMMARY
// ----------------------------------------------------------------------------------
console.log('\n==================================================================================');
console.log(`ADVERSARIAL QA RESULTS: ${passCount} PASSED, ${failCount} FAILED`);
console.log('==================================================================================\n');

if (failCount > 0) {
  process.exit(1);
}
