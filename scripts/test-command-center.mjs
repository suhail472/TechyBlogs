import { validatePublicationIntegrity } from '../src/lib/services/editorial.service.js';

async function runCommandCenterTests() {
  console.log('=====================================================');
  console.log('TECHYBLOGS — NEWSROOM COMMAND CENTER INTEGRATION TESTS');
  console.log('=====================================================\n');

  try {
    // 1. Test Publication Integrity Validation on Complete Draft
    const testDraft = {
      title: 'Breaking AI Announcement 2026',
      content: 'Major developments in machine learning infrastructure.',
      author: 'Suheel Hilal',
      primarySection: 'Technology',
      contentType: 'article',
      image: 'https://images.unsplash.com/photo-test',
      slug: 'breaking-ai-announcement-2026',
      metaDescription: 'Complete breakdown of new AI models and inference engines.',
      faqs: [{ question: 'What is it?', answer: 'It is an advanced framework.' }],
    };

    const validResult = validatePublicationIntegrity(testDraft);
    if (!validResult.isValid) {
      throw new Error(`Valid post failed validation: ${validResult.issues.join(', ')}`);
    }
    console.log('✅ validatePublicationIntegrity PASSED for complete draft.');

    // 2. Test Publication Integrity Rejection on Incomplete Draft
    const brokenDraft = {
      title: 'Incomplete Story',
      content: '', // missing body
      author: '', // missing author
      primarySection: '', // missing section
      image: '', // missing cover
      slug: '', // missing slug
    };
    const invalidResult = validatePublicationIntegrity(brokenDraft);
    if (invalidResult.isValid || invalidResult.issues.length === 0) {
      throw new Error('Broken draft was incorrectly approved for publication!');
    }
    console.log(`✅ validatePublicationIntegrity correctly rejected broken draft with ${invalidResult.issues.length} blocking issues:`);
    invalidResult.issues.forEach((iss) => console.log(`   - ${iss}`));

    // 3. Test Publication Integrity on Incomplete FAQ
    const brokenFaqDraft = {
      ...testDraft,
      faqs: [{ question: 'Unanswered Question?', answer: '' }],
    };
    const brokenFaqResult = validatePublicationIntegrity(brokenFaqDraft);
    if (brokenFaqResult.isValid) {
      throw new Error('Incomplete FAQ was not rejected!');
    }
    console.log(`✅ validatePublicationIntegrity correctly rejected incomplete FAQ: "${brokenFaqResult.issues[0]}"`);

    console.log('\n=====================================================');
    console.log('ALL NEWSROOM COMMAND CENTER UNIT & INTEGRATION TESTS PASSED!');
    console.log('=====================================================\n');
    process.exit(0);
  } catch (err) {
    console.error('❌ Command Center Test Failed:', err);
    process.exit(1);
  }
}

runCommandCenterTests();
