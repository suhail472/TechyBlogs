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

let BASE_URL = 'http://localhost:3000';

async function findActivePort() {
  for (const port of [3000, 3001, 3002, 3003]) {
    try {
      const res = await fetch(`http://localhost:${port}/api/webhooks/resend/inbound`);
      if (res.status === 200) {
        BASE_URL = `http://localhost:${port}`;
        return BASE_URL;
      }
    } catch (e) {}
  }
  return BASE_URL;
}

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

  await findActivePort();
  console.log(`Targeting test server at: ${BASE_URL}\n`);

  await connectToDatabase();

  const testSuffix = Date.now();
  const readerEmail = `test_reader_${testSuffix}@gmail.com`;
  const staffEmail = `staff_${testSuffix}@techyblogging.in`;
  const testPassword = 'SecureStaffPassword2026!';
  const testToken = 'TB-STAFF99';

  // -------------------------------------------------------------
  // SUITE 1: STAFF & CONTRIBUTOR ROLE INITIALIZATION
  // -------------------------------------------------------------
  console.log('1. Setting up Staff & Contributor Roles for Authorization Checks...');

  const staffAdmin = await Admin.create({
    name: 'Senior Editor',
    email: staffEmail,
    password: testPassword,
    role: 'editor',
    loginToken: testToken,
  });

  const contributorEmail = `contrib_${testSuffix}@teachyblogs.com`;
  const contributorUser = await Admin.create({
    name: 'Guest Contributor',
    email: contributorEmail,
    password: testPassword,
    role: 'contributor',
    loginToken: 'TB-CONTRIB01',
  });

  const staffToken = authService.generateToken(staffAdmin);
  const contribToken = authService.generateToken(contributorUser);
  assert(typeof staffToken === 'string' && staffToken.length > 20, 'Generated valid JWT token for Editor');
  assert(typeof contribToken === 'string' && contribToken.length > 20, 'Generated valid JWT token for Contributor');

  // -------------------------------------------------------------
  // SUITE 2: INBOUND EMAIL PARSING & XSS SANITIZATION
  // -------------------------------------------------------------
  console.log('\n2. Testing Inbound Email Processing & XSS Sanitization...');

  const hostilePayload = {
    from: `Investigative Reader <${readerEmail}>`,
    to: ['editorial@techyblogging.in'],
    subject: `News Tip: Clean Energy Breakthrough [${testSuffix}]`,
    text: 'A new breakthrough in hydropower was announced today.',
    html: `
      <p>A new breakthrough in <strong>hydropower</strong> was announced today.</p>
      <script>alert("xss")</script>
      <iframe src="https://attacker.com/malicious"></iframe>
      <img src="valid.png" onerror="alert('hack')" />
      <a href="javascript:alert(1)">Click here</a>
    `,
    message_id: `<inbound_${testSuffix}@mail.gmail.com>`,
  };

  const inboundResult = await emailService.processInboundEmail(hostilePayload);
  assert(inboundResult !== null && inboundResult.email && inboundResult.email._id, 'Processed inbound email successfully');

  const storedInbound = await Email.findById(inboundResult.email._id);
  assert(storedInbound !== null, 'Inbound email persisted into MongoDB');
  assert(storedInbound.folder === 'inbox', 'Inbound email placed in folder "inbox"');
  assert(storedInbound.direction === 'inbound', 'Direction correctly tagged as "inbound"');
  assert(storedInbound.isRead === false, 'New inbound email is unread (isRead: false)');

  // XSS Neutralization Assertions
  assert(!storedInbound.body?.html?.includes('<script') && !storedInbound.html?.includes('<script'), 'Sanitized and stripped <script> tags');
  assert(!storedInbound.body?.html?.includes('<iframe') && !storedInbound.html?.includes('<iframe'), 'Sanitized and stripped <iframe> tags');
  assert(!storedInbound.body?.html?.includes('onerror=') && !storedInbound.html?.includes('onerror='), 'Sanitized and stripped onerror event handlers');
  assert(!storedInbound.body?.html?.includes('href="javascript:') && !storedInbound.html?.includes('href="javascript:'), 'Sanitized and stripped javascript: URL links');

  // -------------------------------------------------------------
  // SUITE 3: THREAD HIERARCHY & OUTBOUND REPLY DISPATCH
  // -------------------------------------------------------------
  console.log('\n3. Testing Thread Hierarchy & Outbound Reply Dispatch...');

  const replyHtml = '<p>Thank you for the tip. Our energy desk is reviewing the report.</p>';
  const replyResult = await emailService.sendReply({
    originalEmailId: storedInbound._id,
    actor: staffAdmin,
    html: replyHtml,
    text: 'Thank you for the tip. Our energy desk is reviewing the report.',
  });

  assert(replyResult !== null && replyResult.email && replyResult.email._id, 'Dispatched reply via Resend email service');
  assert(replyResult.threadId === storedInbound.threadId, 'Reply shares exact same threadId as initial inbound message');

  const storedReply = await Email.findById(replyResult.email._id);
  assert(storedReply !== null, 'Reply email saved into MongoDB');
  assert(storedReply.inReplyTo === storedInbound.messageId, 'In-Reply-To correctly references original message ID');
  assert(storedReply.references.includes(storedInbound.messageId), 'References list contains ancestor message ID');
  assert(storedReply.subject.startsWith('Re: '), 'Subject correctly formatted with "Re: " prefix');
  assert(storedReply.to[0]?.email === readerEmail || storedReply.to?.email === readerEmail, 'Reply recipient strictly matches original sender');

  // Verify Thread View
  const threadView = await emailService.getThreadById(storedInbound.threadId, { markAsRead: true });
  assert(threadView.messages.length === 2, 'Thread messages count is 2 (Inbound pitch + Editorial reply)');
  assert(threadView.messages[0].direction === 'inbound', 'Message 1 is inbound');
  assert(threadView.messages[1].direction === 'outbound', 'Message 2 is outbound');

  const refreshedInbound = await Email.findById(storedInbound._id);
  assert(refreshedInbound.isRead === true, 'Inbound message automatically marked as read upon viewing thread');

  // -------------------------------------------------------------
  // SUITE 4: INBOUND FOLLOW-UP JOINING SAME THREAD
  // -------------------------------------------------------------
  console.log('\n4. Testing Inbound Follow-up Joining Existing Thread...');

  const followUpPayload = {
    from: `Investigative Reader <${readerEmail}>`,
    to: ['editorial@techyblogging.in'],
    subject: `Re: News Tip: Clean Energy Breakthrough [${testSuffix}]`,
    text: 'Here is the PDF paper reference as requested.',
    html: '<p>Here is the PDF paper reference as requested.</p>',
    message_id: `<inbound_followup_${testSuffix}@mail.gmail.com>`,
    headers: {
      'in-reply-to': storedReply.messageId,
      'references': `${storedInbound.messageId} ${storedReply.messageId}`,
    },
  };

  const followUpResult = await emailService.processInboundEmail(followUpPayload);
  assert(followUpResult !== null && followUpResult.email, 'Processed inbound follow-up email');
  assert(followUpResult.threadId === storedInbound.threadId, 'Follow-up successfully recognized and joined existing conversation thread');

  const updatedThread = await emailService.getThreadById(storedInbound.threadId);
  assert(updatedThread.messages.length === 3, 'Thread now contains 3 messages in chronological sequence');

  // -------------------------------------------------------------
  // SUITE 5: SEARCH, FILTERING & BOUNDED PAGINATION
  // -------------------------------------------------------------
  console.log('\n5. Testing Server-Side Search, Sorting & Bounded Pagination...');

  const searchSubject = await emailService.listThreads({
    folder: 'inbox',
    search: 'Hydropower',
    limit: 10,
  });
  assert(searchSubject.threads.some((t) => t.threadId === storedInbound.threadId), 'Search by subject keyword "Hydropower" found thread');

  const searchSender = await emailService.listThreads({
    folder: 'inbox',
    search: readerEmail,
    limit: 10,
  });
  assert(searchSender.threads.some((t) => t.threadId === storedInbound.threadId), 'Search by sender email found thread');

  // ReDoS Defense Test
  const regexInjection = await emailService.listThreads({
    folder: 'inbox',
    search: '(a+)+$',
    limit: 10,
  });
  assert(regexInjection.threads !== undefined, 'Neutralized special regex characters without throwing syntax or ReDoS errors');

  // Bounded Pagination
  const paginated = await emailService.listThreads({ folder: 'inbox', limit: 2, page: 1 });
  assert(paginated.threads.length <= 2, 'Enforced page limit parameter');
  assert(typeof paginated.total === 'number', 'Returned total thread count');

  // -------------------------------------------------------------
  // SUITE 6: THREAD ACTIONS (STAR, ARCHIVE, LABELS)
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
  // SUITE 8: INBOUND WEBHOOK HTTP ENDPOINT & SVIX SIGNATURE VERIFICATION
  // -------------------------------------------------------------
  console.log('\n8. Testing Inbound Webhook HTTP Endpoint & Svix Signature...');

  const webhookSecret = process.env.RESEND_WEBHOOK_SECRET || 'whsec_i/YtB2ZAbLQMRucUbamvR2+RYs+oykMC';
  const svixSecretKey = webhookSecret.startsWith('whsec_') ? webhookSecret.slice(6) : webhookSecret;
  const svixSecretBytes = Buffer.from(svixSecretKey, 'base64');

  const svixId = `msg_test_${testSuffix}`;
  const svixTimestamp = Math.floor(Date.now() / 1000).toString();

  const webhookPayload = {
    type: 'email.received',
    data: {
      from: 'Test Partner <partner@news.org>',
      to: ['editorial@techyblogging.in'],
      subject: `Syndication Partnership Request [${testSuffix}]`,
      text: 'We would like to syndicate TeachyBlogs stories.',
      message_id: `<partner_${testSuffix}@news.org>`,
    },
  };
  const rawBody = JSON.stringify(webhookPayload);
  const toSign = `${svixId}.${svixTimestamp}.${rawBody}`;
  const validSignature = 'v1,' + crypto.createHmac('sha256', svixSecretBytes).update(toSign).digest('base64');

  // Test Valid Svix Signature
  const webhookRes = await fetch(`${BASE_URL}/api/webhooks/resend/inbound`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': validSignature,
    },
    body: rawBody,
  });
  const webhookData = await webhookRes.json();
  assert(webhookRes.status === 200 && webhookData.success, 'Inbound webhook processed valid Svix signed payload');

  // Test Tampered Signature Rejection
  const tamperedRes = await fetch(`${BASE_URL}/api/webhooks/resend/inbound`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': 'v1,invalid_signature_hash_bytes',
    },
    body: rawBody,
  });
  assert(tamperedRes.status === 403, 'Tampered or invalid Svix signature strictly blocked with 403 Forbidden');

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

  if (failed > 0) {
    process.exit(1);
  }
}

runEmailCenterSuite().catch((err) => {
  console.error('Fatal error during email center test suite:', err);
  process.exit(1);
});
