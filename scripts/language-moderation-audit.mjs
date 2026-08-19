import fs from 'fs';

// Load .env.local
if (fs.existsSync('.env.local')) {
  const envConfig = fs.readFileSync('.env.local', 'utf-8');
  for (const line of envConfig.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const [key, ...rest] = trimmed.split('=');
    if (key && rest.length) {
      process.env[key.trim()] = rest.join('=').trim();
    }
  }
}

async function runLanguageAudit() {
  console.log('\n======================================================');
  console.log('TEACHYBLOGS AI — MULTILINGUAL & CODE-SWITCHING AUDIT');
  console.log('======================================================\n');

  const { analyzeCommentContent } = await import('../src/lib/ai/moderation.service.js');

  const LANGUAGE_CASES = [
    // 1. Roman Urdu / Hindi - Safe Disagreement & Compliments
    {
      language: 'Roman Urdu (Safe)',
      text: 'Yeh article bohot informative hai, Next.js ka architecture kaafi achi tarah samjhaya gaya hai.',
      expectedSafe: true,
    },
    {
      language: 'Roman Urdu (Critique)',
      text: 'Mujhe lagta hai yeh approach sahi nahi hai, SQL databases zayada behtar hotay hain.',
      expectedSafe: true,
    },
    // 2. Roman Urdu - Insult / Harassment
    {
      language: 'Roman Urdu (Insult)',
      text: 'Yeh banda pagal hai bilkul, bakwas likhta hai hamesha.',
      expectedSafe: false,
    },
    // 3. Urdu Script - Safe Discussion
    {
      language: 'Urdu Script (Safe)',
      text: 'یہ مضمون بہت معلوماتی ہے اور سافٹ ویئر انجینئرنگ کے اصولوں کی بہترین وضاحت کرتا ہے۔',
      expectedSafe: true,
    },
    // 4. Hindi Script - Safe Discussion
    {
      language: 'Hindi Script (Safe)',
      text: 'यह लेख बहुत ही ज्ञानवर्धक है। लेखक ने तकनीक को बहुत सरल तरीके से समझाया है।',
      expectedSafe: true,
    },
    // 5. Arabic Script - Safe Discussion
    {
      language: 'Arabic Script (Safe)',
      text: 'هذا المقال ممتاز ومفيد جداً، شكراً للكاتب على الشرح الوافي.',
      expectedSafe: true,
    },
    // 6. Mixed Code-Switching
    {
      language: 'Code-Switching (Safe)',
      text: 'Honestly yaar, performance metrics bohot solid hain is framework ke.',
      expectedSafe: true,
    },
  ];

  let passed = 0;
  let failed = 0;

  for (const test of LANGUAGE_CASES) {
    console.log(`Testing: [${test.language}] "${test.text.slice(0, 50)}..."`);
    const result = await analyzeCommentContent({ text: test.text, forceFresh: true });
    const isClassifiedSafe = result.classification === 'safe' || (result.classification === 'review' && result.severity <= 1);

    if (test.expectedSafe) {
      if (isClassifiedSafe) {
        console.log(`  ✓ PASS: Handled safely (Class: ${result.classification}, Sev: ${result.severity}, Reason: ${result.reason})`);
        passed++;
      } else {
        console.error(`  ✗ FAIL: Incorrectly flagged non-English safe comment! (Class: ${result.classification}, Sev: ${result.severity}, Reason: ${result.reason})`);
        failed++;
      }
    } else {
      if (!isClassifiedSafe) {
        console.log(`  ✓ PASS: Correctly flagged non-English abuse (Class: ${result.classification}, Sev: ${result.severity}, Reason: ${result.reason})`);
        passed++;
      } else {
        console.error(`  ✗ FAIL: Missed non-English abusive comment!`);
        failed++;
      }
    }
  }

  console.log('\n======================================================');
  console.log(`LANGUAGE AUDIT SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('======================================================\n');

  process.exit(failed === 0 ? 0 : 1);
}

runLanguageAudit().catch((err) => {
  console.error('Fatal language audit error:', err);
  process.exit(1);
});
