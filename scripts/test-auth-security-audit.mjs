import fs from 'fs';

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
import Admin from '../src/lib/models/admin.model.js';
import authService from '../src/lib/services/auth.service.js';

const MASTER_SECRET = process.env.ADMIN_REGISTRATION_SECRET || 'TB_NEWSROOM_SECRET_2026';
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

async function runSecurityAudit() {
  console.log('================================================================');
  console.log('TEACHYBLOGS — NEWSROOM AUTHENTICATION & SECURITY RED-TEAM SUITE');
  console.log('================================================================\n');

  await connectToDatabase();

  const auditEmail = `audit_sec_${Date.now()}@teachyblogs.com`;
  const auditPassword = 'SecurePassword2026!';
  const auditToken = `TB-AUDIT-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

  // -------------------------------------------------------------
  // SUITE 1: REGISTRATION MASTER PASSKEY ATTACKS
  // -------------------------------------------------------------
  console.log('1. Testing Master Registration Passkey Attack Vectors...');

  // Attack 1.1: Registration without master secret
  const res1_1 = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Unauth Attacker',
      email: 'attacker1@evil.com',
      password: 'password123',
      role: 'admin',
      loginToken: 'TB-TOKEN1',
    }),
  });
  const data1_1 = await res1_1.json();
  assert(!data1_1.success && res1_1.status >= 400, 'Blocked registration attempt without master secret passkey');

  // Attack 1.2: Registration with empty string master secret
  const res1_2 = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Unauth Attacker',
      email: 'attacker2@evil.com',
      password: 'password123',
      role: 'admin',
      loginToken: 'TB-TOKEN1',
      registrationSecret: '   ',
    }),
  });
  const data1_2 = await res1_2.json();
  assert(!data1_2.success && res1_2.status >= 400, 'Blocked registration attempt with whitespace master secret');

  // Attack 1.3: Registration with wrong master secret
  const res1_3 = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Unauth Attacker',
      email: 'attacker3@evil.com',
      password: 'password123',
      role: 'admin',
      loginToken: 'TB-TOKEN1',
      registrationSecret: 'wrong_secret_guess_12345',
    }),
  });
  const data1_3 = await res1_3.json();
  assert(!data1_3.success && res1_3.status >= 400, 'Blocked registration attempt with invalid master secret guess');

  // Attack 1.4: NoSQL Injection Object in registrationSecret ({ "$gt": "" })
  const res1_4 = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'NoSQL Attacker',
      email: 'attacker4@evil.com',
      password: 'password123',
      role: 'admin',
      loginToken: 'TB-TOKEN1',
      registrationSecret: { $gt: '' },
    }),
  });
  const data1_4 = await res1_4.json();
  assert(!data1_4.success && res1_4.status >= 400, 'Neutralized & blocked NoSQL Object injection in master secret');

  // Attack 1.5: NoSQL Regex Object in registrationSecret ({ "$regex": ".*" })
  const res1_5 = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'NoSQL Attacker',
      email: 'attacker5@evil.com',
      password: 'password123',
      role: 'admin',
      loginToken: 'TB-TOKEN1',
      registrationSecret: { $regex: '.*' },
    }),
  });
  const data1_5 = await res1_5.json();
  assert(!data1_5.success && res1_5.status >= 400, 'Neutralized & blocked NoSQL Regex injection in master secret');

  // -------------------------------------------------------------
  // SUITE 2: REGISTRATION MANDATORY TOKEN & INPUT SANITIZATION
  // -------------------------------------------------------------
  console.log('\n2. Testing Registration Mandatory Token & Input Sanitization...');

  // Attack 2.1: Registration without mandatory security token
  const res2_1 = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'No Token Staff',
      email: 'notoken@teachyblogs.com',
      password: 'password123',
      role: 'editor',
      registrationSecret: MASTER_SECRET,
      loginToken: '',
    }),
  });
  const data2_1 = await res2_1.json();
  assert(!data2_1.success && res2_1.status >= 400, 'Blocked registration without mandatory security token');

  // Attack 2.2: Registration with short security token (< 4 chars)
  const res2_2 = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Short Token Staff',
      email: 'shorttoken@teachyblogs.com',
      password: 'password123',
      role: 'editor',
      registrationSecret: MASTER_SECRET,
      loginToken: '123',
    }),
  });
  const data2_2 = await res2_2.json();
  assert(!data2_2.success && res2_2.status >= 400, 'Blocked registration with short security token (<4 chars)');

  // Attack 2.3: Registration with weak / short password (< 6 chars)
  const res2_3 = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Weak Pass Staff',
      email: 'weakpass@teachyblogs.com',
      password: '12345',
      role: 'editor',
      registrationSecret: MASTER_SECRET,
      loginToken: 'TB-TOKEN123',
    }),
  });
  const data2_3 = await res2_3.json();
  assert(!data2_3.success && res2_3.status >= 400, 'Blocked registration with weak password (<6 chars)');

  // Attack 2.4: Registration with malformed email format
  const res2_4 = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Bad Email Staff',
      email: 'notanemailaddress',
      password: 'password123',
      role: 'editor',
      registrationSecret: MASTER_SECRET,
      loginToken: 'TB-TOKEN123',
    }),
  });
  const data2_4 = await res2_4.json();
  assert(!data2_4.success && res2_4.status >= 400, 'Blocked registration with malformed email format');

  // Attack 2.5: NoSQL Object injection in Email during registration
  const res2_5 = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'NoSQL Email Attacker',
      email: { $ne: null },
      password: 'password123',
      role: 'editor',
      registrationSecret: MASTER_SECRET,
      loginToken: 'TB-TOKEN123',
    }),
  });
  const data2_5 = await res2_5.json();
  assert(!data2_5.success && res2_5.status >= 400, 'Neutralized & blocked NoSQL Object injection in email during registration');

  // -------------------------------------------------------------
  // SUITE 3: LEGITIMATE REGISTRATION & DUPLICATE COLLISION
  // -------------------------------------------------------------
  console.log('\n3. Testing Legitimate Registration & Duplicate Account Collision...');

  // Step 3.1: Valid Registration with Master Passkey & Mandatory Token
  const res3_1 = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Audit Security Officer',
      email: auditEmail,
      password: auditPassword,
      role: 'admin',
      registrationSecret: MASTER_SECRET,
      loginToken: auditToken,
    }),
  });
  const data3_1 = await res3_1.json();
  assert(data3_1.success && res3_1.status === 201, 'Successfully registered authorized account with master passkey & mandatory token');
  assert(data3_1.data?.admin?.email === auditEmail, 'Admin record correctly created with matching email');

  // Step 3.2: Duplicate Registration Collision with same email
  const res3_2 = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Duplicate Officer',
      email: auditEmail,
      password: auditPassword,
      role: 'admin',
      registrationSecret: MASTER_SECRET,
      loginToken: auditToken,
    }),
  });
  const data3_2 = await res3_2.json();
  assert(!data3_2.success && res3_2.status >= 400, 'Blocked duplicate account creation with existing email');

  // -------------------------------------------------------------
  // SUITE 4: LOGIN ATTACKS & MANDATORY TOKEN VERIFICATION
  // -------------------------------------------------------------
  console.log('\n4. Testing Login Attack Vectors & Mandatory Token Enforcement...');

  // Attack 4.1: Login WITHOUT Mandatory Security Token
  const res4_1 = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: auditEmail,
      password: auditPassword,
      token: '',
    }),
  });
  const data4_1 = await res4_1.json();
  assert(!data4_1.success && res4_1.status === 401, 'Blocked login attempt without mandatory security token (401 Unauthorized)');

  // Attack 4.2: Login with WRONG Security Token
  const res4_2 = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: auditEmail,
      password: auditPassword,
      token: 'TB-WRONG-TOKEN-999',
    }),
  });
  const data4_2 = await res4_2.json();
  assert(!data4_2.success && res4_2.status === 401, 'Blocked login attempt with invalid security token');

  // Attack 4.3: Login with WRONG Password
  const res4_3 = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: auditEmail,
      password: 'WrongPassword123!',
      token: auditToken,
    }),
  });
  const data4_3 = await res4_3.json();
  assert(!data4_3.success && res4_3.status === 401, 'Blocked login attempt with incorrect password');

  // Attack 4.4: Login with NoSQL Object Injection in Password ({ "$gt": "" })
  const res4_4 = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: auditEmail,
      password: { $gt: '' },
      token: auditToken,
    }),
  });
  const data4_4 = await res4_4.json();
  assert(!data4_4.success && res4_4.status === 401, 'Neutralized & blocked NoSQL Object injection in login password');

  // Attack 4.5: Login with NoSQL Object Injection in Token ({ "$gt": "" })
  const res4_5 = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: auditEmail,
      password: auditPassword,
      token: { $gt: '' },
    }),
  });
  const data4_5 = await res4_5.json();
  assert(!data4_5.success && res4_5.status === 401, 'Neutralized & blocked NoSQL Object injection in login security token');

  // Attack 4.6: Login with NoSQL Object Injection in Email ({ "$gt": "" })
  const res4_6 = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: { $gt: '' },
      password: auditPassword,
      token: auditToken,
    }),
  });
  const data4_6 = await res4_6.json();
  assert(!data4_6.success && res4_6.status === 401, 'Neutralized & blocked NoSQL Object injection in login email');

  // Attack 4.7: Login with Non-Existent Account
  const res4_7 = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'nonexistent_ghost@teachyblogs.com',
      password: 'password123',
      token: 'TB-NONEXISTENT',
    }),
  });
  const data4_7 = await res4_7.json();
  assert(!data4_7.success && res4_7.status === 401, 'Blocked login attempt for non-existent account with uniform 401 error');

  // -------------------------------------------------------------
  // SUITE 5: VALID AUTHENTICATED LOGIN & TOKEN VERIFICATION
  // -------------------------------------------------------------
  console.log('\n5. Testing Valid Authenticated Login & Session Token Signing...');

  // Step 5.1: Valid Login with Email + Password + Mandatory Token
  const res5_1 = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: auditEmail,
      password: auditPassword,
      token: auditToken,
    }),
  });
  const data5_1 = await res5_1.json();
  assert(data5_1.success && res5_1.status === 200, 'Authenticated login successful with valid credentials & mandatory token');
  assert(typeof data5_1.data?.token === 'string' && data5_1.data.token.length > 20, 'Cryptographic JWT session token issued');

  // Step 5.2: Verify JWT Token Payload Signature
  const verifiedPayload = authService.verifyToken(data5_1.data.token);
  assert(verifiedPayload && verifiedPayload.id === data5_1.data.admin?.id, 'JWT session token cryptographically verified with matching admin ID');

  // Step 5.3: Account Deactivation Lockdown Check
  await Admin.updateOne({ email: auditEmail }, { isActive: false, status: 'inactive' });
  const res5_3 = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: auditEmail,
      password: auditPassword,
      token: auditToken,
    }),
  });
  const data5_3 = await res5_3.json();
  assert(!data5_3.success && res5_3.status === 401, 'Deactivated account immediately blocked from newsroom login');

  // -------------------------------------------------------------
  // SUITE 6: AUDIT CLEANUP
  // -------------------------------------------------------------
  console.log('\n6. Cleaning Up Audit Artifacts...');
  await Admin.deleteMany({ email: auditEmail });
  console.log('  ✓ Cleaned up all security audit test accounts.');

  console.log('\n================================================================');
  console.log(`AUTH SECURITY RED-TEAM SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runSecurityAudit().catch((err) => {
  console.error('Security audit fatal error:', err);
  process.exit(1);
});
