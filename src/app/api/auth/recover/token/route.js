import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import authService from '@/lib/services/auth.service';

export async function POST(req) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { email, otp, currentPassword, newLoginToken } = body || {};

    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '';
    const userAgent = req.headers.get('user-agent') || '';

    if (!email || !otp || !currentPassword || !newLoginToken) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Email, verification code, current password, and new security token are required.',
        },
        { status: 400 }
      );
    }

    const result = await authService.confirmSecurityTokenRecovery(
      email,
      otp,
      currentPassword,
      newLoginToken,
      { ip, userAgent }
    );

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message || 'Security token recovery failed.' },
      { status: 400 }
    );
  }
}
