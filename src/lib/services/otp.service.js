import crypto from 'crypto';
import Otp, { OTP_PURPOSES } from '../models/otp.model.js';
import emailService from './email.service.js';

function getOtpPepper() {
  return process.env.JWT_SECRET || 'techyblogs_otp_pepper_2026';
}

const MAX_ATTEMPTS_PER_OTP = 5;
const OTP_EXPIRY_MINUTES = 10;
const COOLDOWN_SECONDS = 60;
const MAX_REQUESTS_PER_HOUR = 5;

class OtpService {
  /**
   * Hashes raw OTP with SHA-256 and pepper
   */
  hashOtp(otp, email, purpose) {
    const cleanEmail = (email || '').toLowerCase().trim();
    const cleanOtp = (otp || '').toString().trim();
    return crypto
      .createHash('sha256')
      .update(`${cleanEmail}:${purpose}:${cleanOtp}:${getOtpPepper()}`)
      .digest('hex');
  }

  /**
   * Generates a cryptographically secure 6-digit OTP string
   */
  generateSecureOtp() {
    return crypto.randomInt(100000, 1000000).toString();
  }

  /**
   * Generates and dispatches an OTP.
   * Enforces rate limiting, cooldown, and anti-enumeration.
   */
  async generateAndSendOtp({
    email,
    purpose,
    ip = '',
    userAgent = '',
    accountExists = false,
    recipientName = '',
  }) {
    if (!email || typeof email !== 'string') {
      throw new Error('Valid email address is required for OTP generation.');
    }
    if (!purpose || !OTP_PURPOSES.includes(purpose)) {
      throw new Error(`Invalid OTP purpose: ${purpose}`);
    }

    const cleanEmail = email.toLowerCase().trim();
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    // 1. Rate Limiting Check: Count OTP requests in the last hour
    const requestsLastHour = await Otp.countDocuments({
      email: cleanEmail,
      createdAt: { $gte: oneHourAgo },
    });

    if (requestsLastHour >= MAX_REQUESTS_PER_HOUR) {
      // If account actually exists, notify rate limit
      if (accountExists) {
        throw new Error(
          'Too many verification requests. Please wait an hour before requesting a new code.'
        );
      }
      // If account doesn't exist, still return generic message for anti-enumeration
      return {
        success: true,
        message: "If an account exists for this email, we've sent a verification code.",
      };
    }

    // 2. Cooldown Check: Enforce 60-second delay between resends
    const latestOtp = await Otp.findOne({
      email: cleanEmail,
      purpose,
    }).sort({ createdAt: -1 });

    if (latestOtp && latestOtp.lastRequestedAt) {
      const timeSinceLastRequest = (now.getTime() - new Date(latestOtp.lastRequestedAt).getTime()) / 1000;
      if (timeSinceLastRequest < COOLDOWN_SECONDS) {
        const remainingWait = Math.ceil(COOLDOWN_SECONDS - timeSinceLastRequest);
        if (accountExists) {
          throw new Error(
            `Please wait ${remainingWait} second${remainingWait === 1 ? '' : 's'} before requesting a new code.`
          );
        }
        return {
          success: true,
          message: "If an account exists for this email, we've sent a verification code.",
        };
      }
    }

    // 3. Generate 6-digit OTP
    const rawOtp = this.generateSecureOtp();
    const hashedOtp = this.hashOtp(rawOtp, cleanEmail, purpose);
    const expiresAt = new Date(now.getTime() + OTP_EXPIRY_MINUTES * 60 * 1000);

    // 4. Invalidate any previously unconsumed OTPs for this (email, purpose)
    await Otp.updateMany(
      { email: cleanEmail, purpose, consumedAt: null },
      { consumedAt: new Date() }
    );

    // 5. If account exists in database, persist new OTP and dispatch email
    if (accountExists) {
      await Otp.create({
        email: cleanEmail,
        purpose,
        hashedOtp,
        attempts: 0,
        maxAttempts: MAX_ATTEMPTS_PER_OTP,
        expiresAt,
        ip,
        userAgent,
        lastRequestedAt: now,
      });

      // Dispatch through Resend
      await emailService.sendOtpEmail({
        to: cleanEmail,
        otp: rawOtp,
        purpose,
        expiryMinutes: OTP_EXPIRY_MINUTES,
        recipientName,
      });
    } else {
      // Anti-enumeration constant-time dummy calculation
      crypto.createHash('sha256').update(`dummy:${cleanEmail}:${rawOtp}`).digest('hex');
    }

    return {
      success: true,
      message: "If an account exists for this email, we've sent a verification code.",
      cooldownSeconds: COOLDOWN_SECONDS,
      expiryMinutes: OTP_EXPIRY_MINUTES,
      devOtp: process.env.NODE_ENV !== 'production' && accountExists ? rawOtp : undefined,
    };
  }

  /**
   * Verifies an OTP code for a specific purpose.
   * Enforces expiration, attempt exhaustion, and purpose isolation.
   */
  async verifyOtp({ email, otp, purpose }) {
    if (!email || typeof email !== 'string') {
      throw new Error('Email is required for OTP verification.');
    }
    if (!otp || typeof otp !== 'string' || otp.trim().length !== 6) {
      throw new Error('Please enter a valid 6-digit verification code.');
    }
    if (!purpose || !OTP_PURPOSES.includes(purpose)) {
      throw new Error(`Invalid OTP purpose: ${purpose}`);
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanOtp = otp.trim();
    const now = new Date();

    // 1. Find the latest active OTP for this email & purpose
    const otpRecord = await Otp.findOne({
      email: cleanEmail,
      purpose,
      consumedAt: null,
    }).sort({ createdAt: -1 });

    if (!otpRecord) {
      throw new Error('No active verification code found. Please request a new code.');
    }

    // 2. Check if expired
    if (now > otpRecord.expiresAt) {
      await Otp.updateOne({ _id: otpRecord._id }, { consumedAt: now });
      throw new Error('This verification code has expired. Please request a new one.');
    }

    // 3. Check attempt limit
    if (otpRecord.attempts >= otpRecord.maxAttempts) {
      await Otp.updateOne({ _id: otpRecord._id }, { consumedAt: now });
      throw new Error('Too many failed attempts. This code has been invalidated. Please request a new one.');
    }

    // 4. Cryptographic Hash Comparison
    const candidateHash = this.hashOtp(cleanOtp, cleanEmail, purpose);
    const candidateBuffer = Buffer.from(candidateHash, 'hex');
    const storedBuffer = Buffer.from(otpRecord.hashedOtp, 'hex');

    const isMatch =
      candidateBuffer.length === storedBuffer.length &&
      crypto.timingSafeEqual(candidateBuffer, storedBuffer);

    if (!isMatch) {
      const newAttempts = otpRecord.attempts + 1;
      const remainingAttempts = Math.max(0, otpRecord.maxAttempts - newAttempts);

      await Otp.updateOne(
        { _id: otpRecord._id },
        {
          attempts: newAttempts,
          consumedAt: remainingAttempts === 0 ? now : null,
        }
      );

      if (remainingAttempts === 0) {
        throw new Error('Too many failed attempts. This code has been invalidated. Please request a new one.');
      }

      throw new Error(
        `Incorrect verification code. You have ${remainingAttempts} attempt${
          remainingAttempts === 1 ? '' : 's'
        } remaining.`
      );
    }

    // 5. Successful Verification -> Consume OTP immediately (One-Time Use)
    await Otp.updateOne({ _id: otpRecord._id }, { consumedAt: now });

    return {
      success: true,
      verified: true,
      email: cleanEmail,
      purpose,
    };
  }
}

const otpService = new OtpService();
export default otpService;
