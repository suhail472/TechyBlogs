import mongoose from 'mongoose';

const adminSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // Don't return password by default
    },
    // System Permission Role
    role: {
      type: String,
      enum: ['contributor', 'author', 'editor', 'moderator', 'admin', 'superadmin'],
      default: 'author',
    },
    // Editorial Byline Title (e.g. "Senior Kashmir Correspondent", "Lead AI Editor")
    title: {
      type: String,
      default: 'Staff Correspondent',
      trim: true,
      maxlength: 120,
    },
    // Editorial Role Classification
    editorialRole: {
      type: String,
      enum: [
        'editor_in_chief',
        'managing_editor',
        'section_editor',
        'bureau_chief',
        'senior_correspondent',
        'staff_writer',
        'columnist',
        'guest_writer',
      ],
      default: 'staff_writer',
    },
    // Regional Bureau Assignment
    bureau: {
      type: String,
      default: 'Global Newsroom',
      trim: true,
    },
    // Primary Editorial Desk / Section (e.g. "Technology", "Education", "Kashmir")
    primaryDesk: {
      type: String,
      default: 'Technology',
      trim: true,
    },
    // Roster Status
    status: {
      type: String,
      enum: ['active', 'on_leave', 'former', 'inactive'],
      default: 'active',
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    verified: {
      type: Boolean,
      default: true,
    },
    featured: {
      type: Boolean,
      default: false,
    },
    order: {
      type: Number,
      default: 0,
    },
    dob: {
      type: Date,
    },
    loginToken: {
      type: String,
      select: true,
    },
    username: { type: String, trim: true, lowercase: true, sparse: true, unique: true },
    slug: { type: String, trim: true, lowercase: true, sparse: true, unique: true },
    avatar: { type: String, default: '' },
    bio: { type: String, default: '', maxlength: 1500 },
    expertise: { type: [String], default: [] },
    website: { type: String, default: '' },
    socialLinks: { type: mongoose.Schema.Types.Mixed, default: {} },
    seo: {
      title: { type: String, default: '' },
      description: { type: String, default: '' },
    },
  },
  {
    timestamps: true,
  }
);

const Admin = mongoose.models.Admin || mongoose.model('Admin', adminSchema);

export default Admin;