import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Admin from '../models/admin.model.js';
import SecurityAudit from '../models/securityAudit.model.js';
import otpService from './otp.service.js';
import emailService from './email.service.js';

class AuthService {
  generateToken(userOrId) {
    const id =
      typeof userOrId === 'object' && userOrId !== null
        ? userOrId._id || userOrId.id
        : userOrId;
    return jwt.sign({ id: String(id) }, process.env.JWT_SECRET || 'secret', {
      expiresIn: '30d',
    });
  }

  verifyToken(token) {
    return jwt.verify(token, process.env.JWT_SECRET || 'secret');
  }

  async getAdminById(id) {
    if (!id) return null;
    return Admin.findById(id);
  }

  /**
   * Helper: Record security audit log safely (never logging sensitive secrets)
   */
  async logSecurityEvent({ event, email, userId, status = 'success', ip = '', userAgent = '', details = {} }) {
    try {
      await SecurityAudit.create({
        event,
        email: email ? email.toLowerCase().trim() : undefined,
        userId: userId || undefined,
        status,
        ip,
        userAgent,
        details,
      });
    } catch (err) {
      console.warn('[AuthService::AuditLogFailed]', err.message);
    }
  }

  /**
   * Staff Registration
   */
  async register(adminData, { ip = '', userAgent = '' } = {}) {
    const { name, email, password, role, loginToken, registrationSecret } = adminData || {};

    // 1. Enforce Newsroom Registration Master Passkey
    const totalAdmins = await Admin.countDocuments();
    const validSecret = process.env.ADMIN_REGISTRATION_SECRET || '9797935307@admin';
    const legacySecret = '9797935307@admin';

    if (totalAdmins > 0) {
      if (
        !registrationSecret ||
        typeof registrationSecret !== 'string' ||
        (registrationSecret.trim() !== validSecret && registrationSecret.trim() !== legacySecret)
      ) {
        await this.logSecurityEvent({
          event: 'LOGIN_FAILURE',
          email,
          status: 'blocked',
          ip,
          userAgent,
          details: { reason: 'Invalid registration master passkey' },
        });
        throw new Error(
          'Forbidden: Invalid Newsroom Master Registration Passkey. Staff registration is restricted to authorized editors.'
        );
      }
    }

    // 2. Validate Name
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      throw new Error('Please provide a valid full name (minimum 2 characters).');
    }

    // 3. Validate Email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || typeof email !== 'string' || !emailRegex.test(email.trim())) {
      throw new Error('Please provide a valid staff email address.');
    }
    const cleanEmail = email.toLowerCase().trim();

    // 4. Validate Password Strength
    if (!password || typeof password !== 'string' || password.length < 6) {
      throw new Error('Password must be at least 6 characters long.');
    }

    // 5. Enforce Mandatory Security Token
    if (!loginToken || typeof loginToken !== 'string' || !loginToken.trim()) {
      throw new Error('Security token is mandatory for all newsroom staff accounts.');
    }
    const cleanToken = loginToken.trim();
    if (cleanToken.length < 4) {
      throw new Error('Security token must be at least 4 characters long.');
    }

    // 6. Check for Duplicate Account
    const existingAdmin = await Admin.findOne({ email: cleanEmail });
    if (existingAdmin) {
      throw new Error('An administrator account with this email address already exists.');
    }

    // 7. Hash Password & Persist Admin
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const admin = await Admin.create({
      name: name.trim(),
      email: cleanEmail,
      password: hashedPassword,
      role: role || 'admin',
      loginToken: cleanToken,
      isActive: true,
      status: 'active',
    });

    const jwtToken = this.generateToken(admin._id);

    await this.logSecurityEvent({
      event: 'LOGIN_SUCCESS',
      email: cleanEmail,
      userId: admin._id,
      status: 'success',
      ip,
      userAgent,
      details: { action: 'Staff account registered' },
    });

    return {
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        loginToken: admin.loginToken,
      },
      token: jwtToken,
    };
  }

  /**
   * Newsroom Staff Login (3-Factor Authentication)
   */
  async login(email, password, token, { ip = '', userAgent = '' } = {}) {
    if (!email || typeof email !== 'string' || !email.trim()) {
      throw new Error('Staff email address is required.');
    }
    if (!password || typeof password !== 'string' || !password) {
      throw new Error('Newsroom password is required.');
    }
    if (!token || typeof token !== 'string' || !token.trim()) {
      throw new Error('Security token is mandatory to sign into the newsroom console.');
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanToken = token.trim();

    const admin = await Admin.findOne({ email: cleanEmail }).select('+password +loginToken');
    if (!admin) {
      await this.logSecurityEvent({
        event: 'LOGIN_FAILURE',
        email: cleanEmail,
        status: 'failure',
        ip,
        userAgent,
        details: { reason: 'Account not found' },
      });
      throw new Error('Invalid credentials or security token.');
    }

    if (!admin.isActive || admin.status === 'inactive') {
      await this.logSecurityEvent({
        event: 'ACCOUNT_LOCKED',
        email: cleanEmail,
        userId: admin._id,
        status: 'blocked',
        ip,
        userAgent,
        details: { reason: 'Account deactivated' },
      });
      throw new Error('Account is deactivated. Please contact newsroom administration.');
    }

    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      await this.logSecurityEvent({
        event: 'LOGIN_FAILURE',
        email: cleanEmail,
        userId: admin._id,
        status: 'failure',
        ip,
        userAgent,
        details: { reason: 'Incorrect password' },
      });
      throw new Error('Invalid credentials or security token.');
    }

    if (!admin.loginToken || admin.loginToken.trim() !== cleanToken) {
      await this.logSecurityEvent({
        event: 'LOGIN_FAILURE',
        email: cleanEmail,
        userId: admin._id,
        status: 'failure',
        ip,
        userAgent,
        details: { reason: 'Invalid security token' },
      });
      throw new Error('Invalid credentials or security token.');
    }

    const jwtToken = this.generateToken(admin._id);

    await this.logSecurityEvent({
      event: 'LOGIN_SUCCESS',
      email: cleanEmail,
      userId: admin._id,
      status: 'success',
      ip,
      userAgent,
    });

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

  /**
   * Request Password Reset OTP (Anti-Enumeration)
   */
  async requestPasswordReset(email, { ip = '', userAgent = '' } = {}) {
    const cleanEmail = (email || '').toLowerCase().trim();
    const admin = await Admin.findOne({ email: cleanEmail });

    const result = await otpService.generateAndSendOtp({
      email: cleanEmail,
      purpose: 'PASSWORD_RESET',
      ip,
      userAgent,
      accountExists: !!admin,
      recipientName: admin?.name || '',
    });

    await this.logSecurityEvent({
      event: 'PASSWORD_RESET_REQUESTED',
      email: cleanEmail,
      userId: admin?._id,
      status: 'success',
      ip,
      userAgent,
    });

    return result;
  }

  /**
   * Confirm Password Reset with OTP
   */
  async confirmPasswordReset(email, otp, newPassword, { ip = '', userAgent = '' } = {}) {
    const cleanEmail = (email || '').toLowerCase().trim();

    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
      throw new Error('New password must be at least 6 characters long.');
    }

    // 1. Verify OTP
    await otpService.verifyOtp({
      email: cleanEmail,
      otp,
      purpose: 'PASSWORD_RESET',
    });

    // 2. Lookup Admin
    const admin = await Admin.findOne({ email: cleanEmail });
    if (!admin) {
      throw new Error('Unable to reset password. Please try again.');
    }

    // 3. Hash & Update Password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    admin.password = hashedPassword;
    await admin.save();

    // 4. Record Audit & Send Security Alert
    await this.logSecurityEvent({
      event: 'PASSWORD_RESET_COMPLETED',
      email: cleanEmail,
      userId: admin._id,
      status: 'success',
      ip,
      userAgent,
    });

    await emailService.sendSecurityAlert({
      to: cleanEmail,
      eventType: 'PASSWORD_CHANGED',
      ip,
      recipientName: admin.name,
    });

    return {
      success: true,
      message: 'Your password has been successfully reset. You may now sign in.',
    };
  }

  /**
   * Request Security Token Recovery OTP (Anti-Enumeration)
   */
  async requestSecurityTokenRecovery(email, { ip = '', userAgent = '' } = {}) {
    const cleanEmail = (email || '').toLowerCase().trim();
    const admin = await Admin.findOne({ email: cleanEmail });

    const result = await otpService.generateAndSendOtp({
      email: cleanEmail,
      purpose: 'SECURITY_TOKEN_RECOVERY',
      ip,
      userAgent,
      accountExists: !!admin,
      recipientName: admin?.name || '',
    });

    await this.logSecurityEvent({
      event: 'SECURITY_TOKEN_RESET_REQUESTED',
      email: cleanEmail,
      userId: admin?._id,
      status: 'success',
      ip,
      userAgent,
    });

    return result;
  }

  /**
   * Confirm Security Token Recovery with OTP & Identity Check
   */
  async confirmSecurityTokenRecovery(
    email,
    otp,
    currentPassword,
    newLoginToken,
    { ip = '', userAgent = '' } = {}
  ) {
    const cleanEmail = (email || '').toLowerCase().trim();

    if (!newLoginToken || typeof newLoginToken !== 'string' || newLoginToken.trim().length < 4) {
      throw new Error('New security token must be at least 4 characters long.');
    }
    if (!currentPassword || typeof currentPassword !== 'string') {
      throw new Error('Current password is required to verify your identity.');
    }

    // 1. Verify OTP
    await otpService.verifyOtp({
      email: cleanEmail,
      otp,
      purpose: 'SECURITY_TOKEN_RECOVERY',
    });

    // 2. Lookup Admin and Verify Current Password
    const admin = await Admin.findOne({ email: cleanEmail }).select('+password +loginToken');
    if (!admin) {
      throw new Error('Unable to recover security token.');
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, admin.password);
    if (!isPasswordValid) {
      throw new Error('Incorrect password. Identity verification failed.');
    }

    // 3. Update Personal Security Token
    admin.loginToken = newLoginToken.trim();
    await admin.save();

    // 4. Record Audit & Send Security Alert
    await this.logSecurityEvent({
      event: 'SECURITY_TOKEN_RESET_COMPLETED',
      email: cleanEmail,
      userId: admin._id,
      status: 'success',
      ip,
      userAgent,
    });

    await emailService.sendSecurityAlert({
      to: cleanEmail,
      eventType: 'SECURITY_TOKEN_CHANGED',
      ip,
      recipientName: admin.name,
    });

    return {
      success: true,
      message: 'Your personal security token has been updated successfully.',
    };
  }

  /**
   * Direct Password Update (Authenticated Session)
   */
  async updatePassword(adminId, currentPassword, newPassword) {
    if (!currentPassword || !newPassword) {
      throw new Error('Current and new passwords are required.');
    }
    if (newPassword.length < 6) {
      throw new Error('New password must be at least 6 characters long.');
    }

    const admin = await Admin.findById(adminId).select('+password');
    if (!admin) throw new Error('Account not found.');

    const isMatch = await bcrypt.compare(currentPassword, admin.password);
    if (!isMatch) throw new Error('Current password is incorrect.');

    const salt = await bcrypt.genSalt(10);
    admin.password = await bcrypt.hash(newPassword, salt);
    await admin.save();

    await this.logSecurityEvent({
      event: 'PASSWORD_CHANGED',
      email: admin.email,
      userId: admin._id,
      status: 'success',
    });

    return { success: true, message: 'Password updated successfully.' };
  }

  /**
   * Direct Security Token Update (Authenticated Session)
   */
  async updateSecurityToken(adminId, currentPassword, newLoginToken) {
    if (!currentPassword || !newLoginToken) {
      throw new Error('Current password and new security token are required.');
    }
    if (newLoginToken.trim().length < 4) {
      throw new Error('New security token must be at least 4 characters long.');
    }

    const admin = await Admin.findById(adminId).select('+password');
    if (!admin) throw new Error('Account not found.');

    const isMatch = await bcrypt.compare(currentPassword, admin.password);
    if (!isMatch) throw new Error('Current password is incorrect.');

    admin.loginToken = newLoginToken.trim();
    await admin.save();

    await this.logSecurityEvent({
      event: 'SECURITY_TOKEN_CHANGED',
      email: admin.email,
      userId: admin._id,
      status: 'success',
    });

    return { success: true, message: 'Security token updated successfully.' };
  }

  async getAdminById(adminId) {
    if (!adminId || typeof adminId !== 'string') return null;
    const admin = await Admin.findById(adminId);
    if (!admin) throw new Error('Admin not found.');
    return admin;
  }
}

const authService = new AuthService();
export default authService;