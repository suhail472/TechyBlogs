import mongoose from 'mongoose';

const EMAIL_FOLDERS = ['inbox', 'sent', 'drafts', 'starred', 'archived', 'trash'];
const EMAIL_STATUSES = ['delivered', 'received', 'sent', 'failed', 'draft'];
const EMAIL_LABELS = [
  'Newsroom',
  'Reader Support',
  'Article Tips',
  'Business',
  'Press',
  'Newsletter',
  'Security Alert',
  'Other',
];

const emailParticipantSchema = new mongoose.Schema(
  {
    name: { type: String, default: '', trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
  },
  { _id: false }
);

const emailAttachmentSchema = new mongoose.Schema(
  {
    filename: { type: String, required: true, trim: true },
    contentType: { type: String, default: 'application/octet-stream' },
    size: { type: Number, default: 0 },
    url: { type: String, default: '' },
  },
  { _id: false }
);

const emailSchema = new mongoose.Schema(
  {
    messageId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    threadId: {
      type: String,
      required: true,
      index: true,
    },
    parentMessageId: {
      type: String,
      default: null,
      index: true,
    },
    inReplyTo: {
      type: String,
      default: null,
    },
    references: {
      type: [String],
      default: [],
    },
    from: {
      type: emailParticipantSchema,
      required: true,
    },
    to: {
      type: [emailParticipantSchema],
      required: true,
      default: [],
    },
    cc: {
      type: [emailParticipantSchema],
      default: [],
    },
    bcc: {
      type: [emailParticipantSchema],
      default: [],
    },
    replyTo: {
      type: String,
      default: '',
    },
    subject: {
      type: String,
      required: true,
      trim: true,
      default: '(No Subject)',
      index: true,
    },
    text: {
      type: String,
      default: '',
    },
    html: {
      type: String,
      default: '',
    },
    direction: {
      type: String,
      enum: ['inbound', 'outbound'],
      required: true,
      index: true,
    },
    folder: {
      type: String,
      enum: EMAIL_FOLDERS,
      default: 'inbox',
      index: true,
    },
    status: {
      type: String,
      enum: EMAIL_STATUSES,
      default: 'received',
      index: true,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    isStarred: {
      type: Boolean,
      default: false,
      index: true,
    },
    isArchived: {
      type: Boolean,
      default: false,
      index: true,
    },
    labels: {
      type: [String],
      enum: EMAIL_LABELS,
      default: ['Newsroom'],
      index: true,
    },
    attachments: {
      type: [emailAttachmentSchema],
      default: [],
    },
    providerId: {
      type: String,
      default: '',
      index: true,
    },
    providerMetadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    receivedAt: {
      type: Date,
      default: null,
    },
    sentAt: {
      type: Date,
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for sub-millisecond query performance on large datasets
emailSchema.index({ threadId: 1, createdAt: 1 });
emailSchema.index({ folder: 1, isRead: 1, createdAt: -1 });
emailSchema.index({ 'from.email': 1, createdAt: -1 });
emailSchema.index({ isStarred: 1, createdAt: -1 });
emailSchema.index({ isArchived: 1, createdAt: -1 });
emailSchema.index({ createdAt: -1 });

// Full text index for indexed search across subject, text, and participants
emailSchema.index({
  subject: 'text',
  text: 'text',
  'from.email': 'text',
  'from.name': 'text',
});

const Email = mongoose.models.Email || mongoose.model('Email', emailSchema);

export default Email;
export { EMAIL_FOLDERS, EMAIL_STATUSES, EMAIL_LABELS };
