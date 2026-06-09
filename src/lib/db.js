import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import Admin from './models/admin.model.js';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(
    'Please define the MONGODB_URI environment variable inside .env.local'
  );
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function seedAdmin() {
  try {
    const defaultEmail = process.env.DEFAULT_ADMIN_EMAIL || 'admin@techyblogs.com';
    const defaultPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'admin123';
    const defaultDob = process.env.DEFAULT_ADMIN_DOB || '2002-10-09';

    const existing = await Admin.findOne({ email: defaultEmail });
    if (!existing) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(defaultPassword, salt);
      
      // Parse Date of Birth
      let parsedDob = new Date(defaultDob);
      if (isNaN(parsedDob.getTime())) {
        parsedDob = new Date('2002-10-09');
      }

      await Admin.create({
        name: 'Default Admin',
        email: defaultEmail,
        password: hashedPassword,
        role: 'superadmin',
        dob: parsedDob,
        isActive: true,
        loginToken: 'admin777',
      });
      console.log(`🛡️ Created default admin: ${defaultEmail} with token admin777`);
    } else if (!existing.loginToken) {
      existing.loginToken = 'admin777';
      await existing.save();
      console.log(`🛡️ Updated default admin security loginToken to admin777`);
    }
  } catch (error) {
    console.error('Failed to seed default admin:', error.message);
  }
}

async function connectToDatabase() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then(async (mongoose) => {
      // Seed default admin on first successful connection
      await seedAdmin();
      return mongoose;
    });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

export default connectToDatabase;