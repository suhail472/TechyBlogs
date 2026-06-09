import authService from '../services/auth.service.js';
import connectToDatabase from '../db.js';

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

  try {
    const decoded = authService.verifyToken(token);
    const admin = await authService.getAdminById(decoded.id);
    if (!admin || !admin.isActive) {
      throw new Error('Admin not found or inactive');
    }
    return admin;
  } catch (error) {
    throw new Error('Not authorized to access this route');
  }
}
