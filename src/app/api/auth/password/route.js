import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/middlewares/auth';
import authService from '@/lib/services/auth.service';

export async function PUT(req) {
  try {
    const admin = await verifyAuth(req);
    const body = await req.json();
    const { currentPassword, newPassword } = body;
    
    if (!currentPassword || !newPassword) {
      return NextResponse.json({ success: false, message: 'Current and new passwords are required' }, { status: 400 });
    }

    const result = await authService.updatePassword(admin._id, currentPassword, newPassword);
    return NextResponse.json({ success: true, message: result.message }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}
