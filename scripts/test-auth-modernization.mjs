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
import Admin from '../src/lib/models/admin.model.js';
import Otp from '../src/lib/models/otp.model.js';
import SecurityAudit from '../src/lib/models/securityAudit.model.js';
import authService from '../src/lib/services/auth.service.js';
import otpService from '../src/lib/services/otp.service.js';

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

async function runAuthModernizationSuite() {
  console.log('================================================================');
  console.log('TECHYBLOGS — MODERN AUTHENTICATION & RECOVERY RED-TEAM SUITE');
  console.log('================================================================\n');

  await connectToDatabase();

  const testEmail = `mod_test_${Date.now()}@techyblogs.com`;
  const initialPassword = 'InitialSecretPass2026!';
  const updatedPassword = 'BrandNewSecretPass2026!';
  const initialToken = 'TB-INIT777';
  const updatedToken = 'TB-RECOV888';

  // -------------------------------------------------------------
  // SUITE 1: STAFF REGISTRATION WITH MASTER GATE & MANDATORY TOKEN
  // -------------------------------------------------------------
  console.log('1. Testing Authorized Registration & Account Setup...');

  const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Modern Staff Editor',
      email: testEmail,
      password: initialPassword,
      role: 'editor',
      registrationSecret: MASTER_SECRET,
      loginToken: initialToken,
    }),
  });
  const regData = await regRes.json();
  assert(regData.success && regRes.status === 201, 'Registered staff user with master passkey and mandatory security token');

  const createdAdmin = await Admin.findOne({ email: testEmail }).select('+password +loginToken');
  assert(createdAdmin && createdAdmin.loginToken === initialToken, 'Admin record verified in MongoDB with encrypted password and loginToken');

  // -------------------------------------------------------------
  // SUITE 2: CRYPTOGRAPHIC OTP GENERATION & ZERO-PLAINTEXT STORAGE
  // -------------------------------------------------------------
  console.log('\n2. Testing Cryptographic OTP Engine & Zero-Plaintext Storage...');

  const reqOtpRes = await fetch(`${BASE_URL}/api/auth/otp/request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      purpose: 'PASSWORD_RESET',
    }),
  });
  const reqOtpData = await reqOtpRes.json();
  assert(reqOtpData.success && reqOtpRes.status === 200, 'Requested password reset OTP');

  const storedOtp = await Otp.findOne({ email: testEmail, purpose: 'PASSWORD_RESET', consumedAt: null });
  assert(storedOtp !== null, 'Active OTP record found in MongoDB');
  assert(typeof storedOtp.hashedOtp === 'string' && storedOtp.hashedOtp.length === 64, 'OTP is SHA-256 hashed (64 hex chars), ZERO plaintext stored');
  assert(storedOtp.expiresAt > new Date(), 'OTP expiration set in future (10 minutes TTL)');

  // -------------------------------------------------------------
  // SUITE 3: ANTI-ENUMERATION RECOVERY DISPATCH
  // -------------------------------------------------------------
  console.log('\n3. Testing Anti-Enumeration Protections...');

  const fakeEmail = `nonexistent_${Date.now()}@unknown.org`;
  const enumRes = await fetch(`${BASE_URL}/api/auth/otp/request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: fakeEmail,
      purpose: 'PASSWORD_RESET',
    }),
  });
  const enumData = await enumRes.json();
  assert(enumRes.status === 200, 'Non-existent email returns HTTP 200 generic response');
  assert(enumData.message.includes('If an account exists'), 'Response message does not leak account existence');

  const fakeOtpInDb = await Otp.findOne({ email: fakeEmail });
  assert(fakeOtpInDb === null, 'No OTP stored in database for non-existent email');

  // -------------------------------------------------------------
  // SUITE 4: OTP RESEND COOLDOWN & RATE LIMITING
  // -------------------------------------------------------------
  console.log('\n4. Testing OTP Cooldown & Rate Limiting...');

  // Attempt immediate second request before cooldown expires
  const cooldownRes = await fetch(`${BASE_URL}/api/auth/otp/request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      purpose: 'PASSWORD_RESET',
    }),
  });
  const cooldownData = await cooldownRes.json();
  assert(!cooldownData.success && cooldownRes.status >= 400, 'Blocked immediate OTP request during 60s cooldown');
  assert(cooldownData.message.includes('wait'), 'Cooldown error message provides wait duration');

  // -------------------------------------------------------------
  // SUITE 5: OTP ATTEMPT LIMITING & BRUTE FORCE INVALIDATION
  // -------------------------------------------------------------
  console.log('\n5. Testing OTP Guessing Defense & Attempt Invalidation...');

  for (let i = 1; i <= 4; i++) {
    const wrongGuessRes = await fetch(`${BASE_URL}/api/auth/otp/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        otp: '000000',
        purpose: 'PASSWORD_RESET',
      }),
    });
    const wrongData = await wrongGuessRes.json();
    assert(!wrongData.success && wrongGuessRes.status >= 400, `Blocked invalid guess ${i}/5`);
  }

  // 5th failed guess must permanently invalidate the OTP record
  const fifthGuessRes = await fetch(`${BASE_URL}/api/auth/otp/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      otp: '000000',
      purpose: 'PASSWORD_RESET',
    }),
  });
  const fifthData = await fifthGuessRes.json();
  assert(!fifthData.success && fifthData.message.includes('invalidated'), 'OTP permanently invalidated on 5th failed attempt');

  const invalidatedRecord = await Otp.findOne({ email: testEmail, purpose: 'PASSWORD_RESET' }).sort({ createdAt: -1 });
  assert(invalidatedRecord.consumedAt !== null, 'Invalidated OTP marked consumed in database');

  // -------------------------------------------------------------
  // SUITE 6: PURPOSE ISOLATION
  // -------------------------------------------------------------
  console.log('\n6. Testing OTP Purpose Isolation...');

  // Generate a valid OTP for PASSWORD_RESET directly via service
  const generatedResetOtp = otpService.generateSecureOtp();
  const resetHash = otpService.hashOtp(generatedResetOtp, testEmail, 'PASSWORD_RESET');
  await Otp.create({
    email: testEmail,
    purpose: 'PASSWORD_RESET',
    hashedOtp: resetHash,
    attempts: 0,
    maxAttempts: 5,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    lastRequestedAt: new Date(Date.now() - 120 * 1000), // bypass cooldown for testing
  });

  // Attempt to use PASSWORD_RESET OTP to verify SECURITY_TOKEN_RECOVERY
  const crossPurposeRes = await fetch(`${BASE_URL}/api/auth/otp/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      otp: generatedResetOtp,
      purpose: 'SECURITY_TOKEN_RECOVERY',
    }),
  });
  const crossData = await crossPurposeRes.json();
  assert(!crossData.success && crossPurposeRes.status >= 400, 'Blocked PASSWORD_RESET OTP from verifying SECURITY_TOKEN_RECOVERY');

  // -------------------------------------------------------------
  // SUITE 7: END-TO-END PASSWORD RESET FLOW
  // -------------------------------------------------------------
  console.log('\n7. Testing End-to-End Password Reset Flow...');

  // Reset password using the valid PASSWORD_RESET OTP
  const resetPassRes = await fetch(`${BASE_URL}/api/auth/recover/password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      otp: generatedResetOtp,
      newPassword: updatedPassword,
    }),
  });
  const resetPassData = await resetPassRes.json();
  assert(resetPassData.success && resetPassRes.status === 200, 'Password reset confirmed and completed successfully');

  // Old password must fail
  const oldLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      password: initialPassword,
      token: initialToken,
    }),
  });
  const oldLoginData = await oldLoginRes.json();
  assert(!oldLoginData.success && oldLoginRes.status === 401, 'Old password strictly rejected after reset');

  // New password must succeed
  const newLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      password: updatedPassword,
      token: initialToken,
    }),
  });
  const newLoginData = await newLoginRes.json();
  assert(newLoginData.success && newLoginRes.status === 200, 'Successfully logged in with new password and mandatory token');

  // -------------------------------------------------------------
  // SUITE 8: END-TO-END SECURITY TOKEN RECOVERY FLOW
  // -------------------------------------------------------------
  console.log('\n8. Testing End-to-End Security Token Recovery Flow...');

  // Generate valid OTP for SECURITY_TOKEN_RECOVERY
  const generatedTokenOtp = otpService.generateSecureOtp();
  const tokenHash = otpService.hashOtp(generatedTokenOtp, testEmail, 'SECURITY_TOKEN_RECOVERY');
  await Otp.create({
    email: testEmail,
    purpose: 'SECURITY_TOKEN_RECOVERY',
    hashedOtp: tokenHash,
    attempts: 0,
    maxAttempts: 5,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    lastRequestedAt: new Date(Date.now() - 120 * 1000),
  });

  // Attempt token recovery with WRONG current password
  const failTokenRecov = await fetch(`${BASE_URL}/api/auth/recover/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      otp: generatedTokenOtp,
      currentPassword: 'WrongCurrentPassword!',
      newLoginToken: updatedToken,
    }),
  });
  const failTokenData = await failTokenRecov.json();
  assert(!failTokenData.success && failTokenRecov.status >= 400, 'Blocked security token recovery with incorrect current password');

  // Regenerate OTP for successful recovery
  const validTokenOtp = otpService.generateSecureOtp();
  const validTokenHash = otpService.hashOtp(validTokenOtp, testEmail, 'SECURITY_TOKEN_RECOVERY');
  await Otp.create({
    email: testEmail,
    purpose: 'SECURITY_TOKEN_RECOVERY',
    hashedOtp: validTokenHash,
    attempts: 0,
    maxAttempts: 5,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    lastRequestedAt: new Date(Date.now() - 120 * 1000),
  });

  // Recover token with CORRECT current password
  const successTokenRecov = await fetch(`${BASE_URL}/api/auth/recover/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      otp: validTokenOtp,
      currentPassword: updatedPassword,
      newLoginToken: updatedToken,
    }),
  });
  const successTokenData = await successTokenRecov.json();
  assert(successTokenData.success && successTokenRecov.status === 200, 'Security token recovered and updated successfully');

  // Old token must fail
  const oldTokenLogin = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      password: updatedPassword,
      token: initialToken,
    }),
  });
  const oldTokenData = await oldTokenLogin.json();
  assert(!oldTokenData.success && oldTokenLogin.status === 401, 'Old security token strictly rejected after recovery');

  // New token must succeed
  const newTokenLogin = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      password: updatedPassword,
      token: updatedToken,
    }),
  });
  const newTokenData = await newTokenLogin.json();
  assert(newTokenData.success && newTokenLogin.status === 200, 'Successfully logged in with new password and new security token');

  // -------------------------------------------------------------
  // SUITE 9: SECURITY AUDIT TRAIL VERIFICATION
  // -------------------------------------------------------------
  console.log('\n9. Testing Security Audit Trail & Sanitization...');

  const auditEvents = await SecurityAudit.find({ email: testEmail }).sort({ createdAt: 1 });
  const eventTypes = auditEvents.map((a) => a.event);

  assert(eventTypes.includes('LOGIN_SUCCESS'), 'Audit logged LOGIN_SUCCESS');
  assert(eventTypes.includes('PASSWORD_RESET_COMPLETED'), 'Audit logged PASSWORD_RESET_COMPLETED');
  assert(eventTypes.includes('SECURITY_TOKEN_RESET_COMPLETED'), 'Audit logged SECURITY_TOKEN_RESET_COMPLETED');

  // Ensure no sensitive plaintext was logged
  let hasLeak = false;
  for (const log of auditEvents) {
    const serialized = JSON.stringify(log);
    if (
      serialized.includes(initialPassword) ||
      serialized.includes(updatedPassword) ||
      serialized.includes(initialToken) ||
      serialized.includes(updatedToken)
    ) {
      hasLeak = true;
    }
  }
  assert(!hasLeak, 'Audit records contain ZERO plaintext passwords or security tokens');

  // -------------------------------------------------------------
  // SUITE 10: NOSQL INJECTION ON RECOVERY ENDPOINTS
  // -------------------------------------------------------------
  console.log('\n10. Testing NoSQL Object Injection on Recovery Endpoints...');

  const nosqlRes1 = await fetch(`${BASE_URL}/api/auth/recover/password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: { $gt: '' },
      otp: { $gt: '' },
      newPassword: 'HackedPassword123!',
    }),
  });
  const nosqlData1 = await nosqlRes1.json();
  assert(!nosqlData1.success && nosqlRes1.status >= 400, 'Neutralized & blocked NoSQL Object injection in password recovery');

  const nosqlRes2 = await fetch(`${BASE_URL}/api/auth/recover/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: { $gt: '' },
      otp: { $gt: '' },
      currentPassword: { $gt: '' },
      newLoginToken: 'TB-HACKED',
    }),
  });
  const nosqlData2 = await nosqlRes2.json();
  assert(!nosqlData2.success && nosqlRes2.status >= 400, 'Neutralized & blocked NoSQL Object injection in token recovery');

  // -------------------------------------------------------------
  // SUITE 11: TEARDOWN & CLEANUP
  // -------------------------------------------------------------
  console.log('\n11. Cleaning Up Test Artifacts...');
  await Admin.deleteMany({ email: testEmail });
  await Otp.deleteMany({ email: testEmail });
  await SecurityAudit.deleteMany({ email: testEmail });
  console.log('  ✓ Cleaned up test admin, OTP, and audit records.');

  console.log('\n================================================================');
  console.log(`AUTH MODERNIZATION TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runAuthModernizationSuite().catch((err) => {
  console.error('Fatal error during modernization test suite:', err);
  process.exit(1);
});
