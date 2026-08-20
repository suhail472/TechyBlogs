import mongoose from 'mongoose';

const OTP_PURPOSES = [
  'PASSWORD_RESET',
  'SECURITY_TOKEN_RECOVERY',
  'EMAIL_VERIFICATION',
  'LOGIN_VERIFICATION',
];

const otpSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required for OTP generation'],
      lowercase: true,
      trim: true,
      index: true,
    },
    purpose: {
      type: String,
      required: [true, 'OTP purpose is required'],
      enum: OTP_PURPOSES,
      index: true,
    },
    hashedOtp: {
      type: String,
      required: [true, 'Hashed OTP is required'],
    },
    attempts: {
      type: Number,
      default: 0,
    },
    maxAttempts: {
      type: Number,
      default: 5,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // MongoDB TTL Index: automatically deleted on expiration!
    },
    consumedAt: {
      type: Date,
      default: null,
    },
    ip: {
      type: String,
      default: '',
    },
    userAgent: {
      type: String,
      default: '',
    },
    lastRequestedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for fast lookup of active unconsumed OTP per email & purpose
otpSchema.index({ email: 1, purpose: 1, consumedAt: 1 });

const Otp = mongoose.models.Otp || mongoose.model('Otp', otpSchema);

export default Otp;
export { OTP_PURPOSES };
