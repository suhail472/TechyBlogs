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
    role: {
      type: String,
      enum: ['contributor', 'author', 'editor', 'moderator', 'admin', 'superadmin'],
      default: 'author',
    },
    isActive: {
      type: Boolean,
      default: true,
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
    bio: { type: String, default: '', maxlength: 1000 },
    expertise: { type: [String], default: [] },
    website: { type: String, default: '' },
    socialLinks: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  {
    timestamps: true,
  }
);

// Note: `unique: true` on the `email` field creates an index, avoid duplicate index declarations
const Admin = mongoose.models.Admin || mongoose.model('Admin', adminSchema);

export default Admin;