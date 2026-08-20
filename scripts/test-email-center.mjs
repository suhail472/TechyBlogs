import fs from 'fs';
import crypto from 'crypto';

// 1. Load Environment Variables from .env.local
if (fs.existsSync('.env.local')) {
  const env = fs.readFileSync('.env.local', 'utf-8');
  for (const line of env.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const [k, ...v] = trimmed.split('=');
    if (k && v.length) process.env[k.trim()] = v.join('=').trim();
  }
}

import connectToDatabase from '../src/lib/db.js';
import Email from '../src/lib/models/email.model.js';
import Admin from '../src/lib/models/admin.model.js';
import authService from '../src/lib/services/auth.service.js';
import emailService from '../src/lib/services/email.service.js';

const BASE_URL = 'http://localhost:3001';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

async function runEmailCenterSuite() {
  console.log('================================================================');
  console.log('TEACHYBLOGS — NEWSROOM EMAIL CENTER & INBOX RED-TEAM SUITE');
  console.log('================================================================\n');

  await connectToDatabase();

  const testSuffix = Date.now();
  const readerEmail = `test_reader_${testSuffix}@gmail.com`;
  const staffEmail = `staff_${testSuffix}@techyblogging.in`;
  const contributorEmail = `contrib_${testSuffix}@techyblogging.in`;

  // -------------------------------------------------------------
  // SUITE 1: STAFF & CONTRIBUTOR SETUP
  // -------------------------------------------------------------
  console.log('1. Setting up Staff & Contributor Roles for Authorization Checks...');

  const staffAdmin = await Admin.create({
    name: 'Senior Newsroom Editor',
    email: staffEmail,
    password: 'StaffPassword2026!',
    role: 'editor',
    loginToken: `TB-STAFF${testSuffix}`,
    isActive: true,
  });

  const contributorUser = await Admin.create({
    name: 'Freelance Contributor',
    email: contributorEmail,
    password: 'ContribPassword2026!',
    role: 'contributor',
    loginToken: `TB-CONTRIB${testSuffix}`,
    isActive: true,
  });

  const staffToken = authService.generateToken(staffAdmin);
  const contribToken = authService.generateToken(contributorUser);

  assert(Boolean(staffToken), 'Generated valid JWT token for Editor');
  assert(Boolean(contribToken), 'Generated valid JWT token for Contributor');

  // -------------------------------------------------------------
  // SUITE 2: INBOUND EMAIL PROCESSING & XSS SANITIZATION
  // -------------------------------------------------------------
  console.log('\n2. Testing Inbound Email Processing & XSS Sanitization...');

  const hostileXssHtml = `
    <p>Dear Editorial Board,</p>
    <script>alert("XSS Attack!");</script>
    <img src="https://example.com/logo.png" onerror="alert('Img Injection')" />
    <iframe src="https://malicious-site.com/steal-cookies"></iframe>
    <a href="javascript:stealData()">Click here for details</a>
    <p>I have an urgent Kashmir story pitch.</p>
  `;

  const testSubject = `Urgent Article Tip: Kashmir Hydropower Development ${testSuffix}`;

  const inboundMessageId = `<inbound_${testSuffix}@techyblogging.in>`;
  const inboundRes = await emailService.processInboundEmail({
    from: `Kashmir Observer <${readerEmail}>`,
    to: 'editorial@techyblogging.in',
    subject: testSubject,
    text: 'Dear Editorial Board,\nI have an urgent Kashmir story pitch.',
    html: hostileXssHtml,
    message_id: inboundMessageId,
  });

  assert(inboundRes.success, 'Processed inbound email successfully');
  const storedInbound = await Email.findOne({ messageId: inboundMessageId });
  assert(storedInbound !== null, 'Inbound email persisted into MongoDB');
  assert(storedInbound.folder === 'inbox', 'Inbound email placed in folder "inbox"');
  assert(storedInbound.direction === 'inbound', 'Direction correctly tagged as "inbound"');
  assert(storedInbound.isRead === false, 'New inbound email is unread (isRead: false)');

  // Verify XSS neutralization
  assert(!storedInbound.html.includes('<script>'), 'Sanitized and stripped <script> tags');
  assert(!storedInbound.html.includes('<iframe'), 'Sanitized and stripped <iframe> tags');
  assert(!storedInbound.html.includes('onerror='), 'Sanitized and stripped onerror event handlers');
  assert(!storedInbound.html.includes('javascript:'), 'Sanitized and stripped javascript: URL links');

  // -------------------------------------------------------------
  // SUITE 3: THREAD-BASED CONVERSATION & REPLY DISPATCH
  // -------------------------------------------------------------
  console.log('\n3. Testing Thread Hierarchy & Outbound Reply Dispatch...');

  const replyRes = await emailService.sendReply({
    originalEmailId: storedInbound._id,
    text: 'Thank you for your pitch. We would like to publish this investigation on TeachyBlogs.',
    actor: staffAdmin,
  });

  assert(replyRes.success, 'Dispatched reply via Resend email service');
  assert(replyRes.threadId === storedInbound.threadId, 'Reply shares exact same threadId as initial inbound message');

  const replyEmail = await Email.findOne({ messageId: replyRes.messageId });
  assert(replyEmail !== null, 'Reply email saved into MongoDB');
  assert(replyEmail.inReplyTo === inboundMessageId, 'In-Reply-To correctly references original message ID');
  assert(replyEmail.references.includes(inboundMessageId), 'References list contains ancestor message ID');
  assert(replyEmail.subject.startsWith('Re: Urgent Article Tip'), 'Subject correctly formatted with "Re: " prefix');
  assert(replyEmail.to[0].email === readerEmail, 'Reply recipient strictly matches original sender');

  // Verify thread message count
  const threadMessages = await emailService.getThreadMessages(storedInbound.threadId);
  assert(threadMessages.length === 2, 'Thread messages count is 2 (Inbound pitch + Editorial reply)');
  assert(threadMessages[0].direction === 'inbound', 'Message 1 is inbound');
  assert(threadMessages[1].direction === 'outbound', 'Message 2 is outbound');

  // Verify auto-mark read behavior on getThreadMessages
  const refreshedInbound = await Email.findById(storedInbound._id);
  assert(refreshedInbound.isRead === true, 'Inbound message automatically marked as read upon viewing thread');

  // -------------------------------------------------------------
  // SUITE 4: INBOUND FOLLOW-UP THREAD RECOGNITION
  // -------------------------------------------------------------
  console.log('\n4. Testing Inbound Follow-up Joining Existing Thread...');

  const followUpMessageId = `<followup_${testSuffix}@techyblogging.in>`;
  const followUpRes = await emailService.processInboundEmail({
    from: `Kashmir Observer <${readerEmail}>`,
    to: 'editorial@techyblogging.in',
    subject: `Re: ${testSubject}`,
    text: 'Here is the draft document and photographic assets.',
    headers: {
      'message-id': followUpMessageId,
      'in-reply-to': replyEmail.messageId,
      'references': `${inboundMessageId} ${replyEmail.messageId}`,
    },
  });

  assert(followUpRes.success, 'Processed inbound follow-up email');
  assert(followUpRes.threadId === storedInbound.threadId, 'Follow-up successfully recognized and joined existing conversation thread');

  const updatedThreadMessages = await emailService.getThreadMessages(storedInbound.threadId);
  assert(updatedThreadMessages.length === 3, 'Thread now contains 3 messages in chronological sequence');

  // -------------------------------------------------------------
  // SUITE 5: SERVER-SIDE SEARCH, SORTING & BOUNDED PAGINATION
  // -------------------------------------------------------------
  console.log('\n5. Testing Server-Side Search, Sorting & Bounded Pagination...');

  // Search by subject keyword
  const searchSubjectRes = await emailService.getThreads({
    search: 'Hydropower',
    page: 1,
    limit: 10,
  });
  assert(searchSubjectRes.threads.length >= 1, 'Search by subject keyword "Hydropower" found thread');

  // Search by sender email
  const searchSenderRes = await emailService.getThreads({
    search: readerEmail,
    page: 1,
    limit: 10,
  });
  assert(searchSenderRes.threads.length >= 1, 'Search by sender email found thread');

  // ReDoS and Regex Special Character Immunity Test
  const regexAttackRes = await emailService.getThreads({
    search: '.*+?^${}()|[]\\',
    page: 1,
    limit: 10,
  });
  assert(Array.isArray(regexAttackRes.threads), 'Neutralized special regex characters without throwing syntax or ReDoS errors');

  // Bounded Pagination check
  const pagedRes = await emailService.getThreads({
    page: 1,
    limit: 2,
  });
  assert(pagedRes.pagination.limit === 2, 'Enforced page limit parameter');
  assert(typeof pagedRes.pagination.total === 'number', 'Returned total thread count');

  // -------------------------------------------------------------
  // SUITE 6: THREAD ACTIONS (STAR, ARCHIVE, LABELS, FOLDERS)
  // -------------------------------------------------------------
  console.log('\n6. Testing Thread Actions (Star, Archive, Labels, Folders)...');

  // Star thread
  await emailService.performThreadAction({
    threadId: storedInbound.threadId,
    action: 'star',
  });
  let threadCheck = await Email.findOne({ threadId: storedInbound.threadId, isStarred: true });
  assert(threadCheck !== null, 'Thread successfully starred');

  // Archive thread
  await emailService.performThreadAction({
    threadId: storedInbound.threadId,
    action: 'archive',
  });
  threadCheck = await Email.findOne({ threadId: storedInbound.threadId, isArchived: true });
  assert(threadCheck !== null, 'Thread successfully archived');

  // Set Label
  await emailService.performThreadAction({
    threadId: storedInbound.threadId,
    action: 'setLabel',
    value: 'Article Tips',
  });
  threadCheck = await Email.findOne({ threadId: storedInbound.threadId, labels: 'Article Tips' });
  assert(threadCheck !== null, 'Assigned "Article Tips" label to thread');

  // -------------------------------------------------------------
  // SUITE 7: HTTP API AUTHORIZATION & ROLE ISOLATION
  // -------------------------------------------------------------
  console.log('\n7. Testing HTTP API Authorization & Role Protection...');

  // Editor access should succeed
  const editorHttpRes = await fetch(`${BASE_URL}/api/admin/email/threads`, {
    headers: { Authorization: `Bearer ${staffToken}` },
  });
  const editorData = await editorHttpRes.json();
  assert(editorHttpRes.status === 200 && editorData.success, 'Editor successfully accessed /api/admin/email/threads');

  // Contributor access should be blocked (403 Forbidden)
  const contribHttpRes = await fetch(`${BASE_URL}/api/admin/email/threads`, {
    headers: { Authorization: `Bearer ${contribToken}` },
  });
  assert(contribHttpRes.status === 403, 'Contributor blocked with 403 Forbidden on /api/admin/email/threads');

  // Unauthenticated access should be blocked (401 Unauthorized)
  const anonHttpRes = await fetch(`${BASE_URL}/api/admin/email/threads`);
  assert(anonHttpRes.status === 401, 'Unauthenticated request blocked with 401 Unauthorized');

  // -------------------------------------------------------------
  // SUITE 8: INBOUND WEBHOOK HTTP ENDPOINT & SIGNATURE GATE
  // -------------------------------------------------------------
  console.log('\n8. Testing Inbound Webhook HTTP Endpoint...');

  const webhookPayload = {
    from: 'Test Partner <partner@news.org>',
    to: 'editorial@teachyblogs.com',
    subject: 'Syndication Partnership Request',
    text: 'We would like to syndicate TeachyBlogs stories.',
    message_id: `<partner_${testSuffix}@news.org>`,
  };

  const webhookRes = await fetch(`${BASE_URL}/api/webhooks/resend/inbound`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'authorization': `Bearer ${process.env.RESEND_WEBHOOK_SECRET || 'tb_resend_webhook_sec_2026'}`,
    },
    body: JSON.stringify(webhookPayload),
  });
  const webhookData = await webhookRes.json();
  assert(webhookRes.status === 200 && webhookData.success, 'Inbound webhook endpoint processed and stored email');

  // -------------------------------------------------------------
  // SUITE 9: TEARDOWN & CLEANUP
  // -------------------------------------------------------------
  console.log('\n9. Cleaning Up Test Artifacts...');
  await Email.deleteMany({
    $or: [
      { 'from.email': readerEmail },
      { 'to.email': readerEmail },
      { 'from.email': 'partner@news.org' },
    ],
  });
  await Admin.deleteMany({ _id: { $in: [staffAdmin._id, contributorUser._id] } });
  console.log('  ✓ Cleaned up test emails and admin records.');

  console.log('\n================================================================');
  console.log(`EMAIL CENTER TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  try {
    const mongoose = (await import('mongoose')).default;
    await mongoose.connection.close();
  } catch (e) {}

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runEmailCenterSuite().catch((err) => {
  console.error('Fatal error during email center test suite:', err);
  process.exit(1);
});
