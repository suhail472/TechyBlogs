import mongoose from 'mongoose';

const AUDIT_EVENTS = [
  'LOGIN_SUCCESS',
  'LOGIN_FAILURE',
  'PASSWORD_RESET_REQUESTED',
  'PASSWORD_RESET_COMPLETED',
  'SECURITY_TOKEN_RESET_REQUESTED',
  'SECURITY_TOKEN_RESET_COMPLETED',
  'EMAIL_VERIFIED',
  'PASSWORD_CHANGED',
  'SECURITY_TOKEN_CHANGED',
  'LOGOUT',
  'ACCOUNT_LOCKED',
];

const securityAuditSchema = new mongoose.Schema(
  {
    event: {
      type: String,
      required: true,
      enum: AUDIT_EVENTS,
      index: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      default: null,
      index: true,
    },
    status: {
      type: String,
      enum: ['success', 'failure', 'blocked'],
      default: 'success',
      index: true,
    },
    ip: {
      type: String,
      default: '',
    },
    userAgent: {
      type: String,
      default: '',
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

securityAuditSchema.index({ email: 1, createdAt: -1 });
securityAuditSchema.index({ createdAt: -1 });

const SecurityAudit =
  mongoose.models.SecurityAudit || mongoose.model('SecurityAudit', securityAuditSchema);

export default SecurityAudit;
export { AUDIT_EVENTS };
