import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Admin from '../models/admin.model.js';

class AuthService {
  generateToken(id) {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'secret', {
      expiresIn: '30d',
    });
  }

  verifyToken(token) {
    return jwt.verify(token, process.env.JWT_SECRET || 'secret');
  }

  async register(adminData) {
    const { name, email, password, role } = adminData;
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      throw new Error('Admin with this email already exists');
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const admin = await Admin.create({
      name,
      email,
      password: hashedPassword,
      role: role || 'admin',
    });
    const token = this.generateToken(admin._id);
    return {
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
      token,
    };
  }

  async login(email, password, token) {
    const admin = await Admin.findOne({ email }).select('+password +loginToken');
    if (!admin) throw new Error('Invalid credentials');
    if (!admin.isActive) throw new Error('Account is deactivated');
    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) throw new Error('Invalid credentials');
    
    // Verify security login token
    if (admin.loginToken && admin.loginToken !== token) {
      throw new Error('Invalid security login token');
    }
    
    const jwtToken = this.generateToken(admin._id);
    return {
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
      token: jwtToken,
    };
  }

  async getAdminById(adminId) {
    const admin = await Admin.findById(adminId);
    if (!admin) throw new Error('Admin not found');
    return admin;
  }

  async updatePassword(adminId, currentPassword, newPassword) {
    const admin = await Admin.findById(adminId).select('+password');
    if (!admin) throw new Error('Admin not found');
    const isValid = await bcrypt.compare(currentPassword, admin.password);
    if (!isValid) throw new Error('Current password is incorrect');
    const salt = await bcrypt.genSalt(10);
    admin.password = await bcrypt.hash(newPassword, salt);
    await admin.save();
    return { message: 'Password updated successfully' };
  }

  async resetPasswordByInfo(name, email, dob, newPassword) {
    const admin = await Admin.findOne({ email, name }).select('+password dob');
    if (!admin) throw new Error('No matching admin found');
    if (!admin.dob) throw new Error('DOB not set for this account');

    const inputDate = new Date(dob);
    const adminDob = new Date(admin.dob);
    
    if (inputDate.toISOString().slice(0, 10) !== adminDob.toISOString().slice(0, 10)) {
      throw new Error('Information does not match');
    }

    const salt = await bcrypt.genSalt(10);
    admin.password = await bcrypt.hash(newPassword, salt);
    await admin.save();
    return { message: 'Password reset successfully' };
  }
}

const authService = new AuthService();
export default authService;