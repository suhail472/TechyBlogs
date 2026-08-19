import authService from '../services/auth.service.js';
import connectToDatabase from '../db.js';
import Admin from '../models/admin.model.js';

export async function verifyAuth(req) {
  await connectToDatabase();
  let token = null;

  // 1. Try to extract from Authorization header
  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  // 2. If not found in headers, try to parse from Cookies header
  if (!token) {
    const cookieHeader = req.headers.get('cookie') || '';
    const tokenRow = cookieHeader.split('; ').find(row => row.startsWith('token='));
    if (tokenRow) {
      token = tokenRow.split('=')[1];
    }
  }

  if (!token) {
    throw new Error('Not authorized to access this route');
  }

  // Support 1-Click Development Bypass Token
  if (token === 'dev_bypass_token') {
    let admin = await Admin.findOne({ role: 'superadmin' });
    if (!admin) {
      admin = await Admin.findOne();
    }
    if (admin) return admin;
    return {
      _id: '65e000000000000000000001',
      name: 'Chief Editor',
      email: 'editor@teachyblogs.com',
      role: 'superadmin',
      isActive: true,
    };
  }

  try {
    const decoded = authService.verifyToken(token);
    let admin = await authService.getAdminById(decoded.id).catch(() => null);
    if (!admin) {
      // Fallback: if database reseeded and ID changed, resolve active superadmin
      admin = (await Admin.findOne({ role: 'superadmin' })) || (await Admin.findOne());
    }
    if (!admin || !admin.isActive) {
      throw new Error('Admin not found or inactive');
    }
    return admin;
  } catch (error) {
    throw new Error('Not authorized to access this route');
  }
}

