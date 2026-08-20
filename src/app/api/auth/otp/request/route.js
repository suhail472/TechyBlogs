import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import authService from '@/lib/services/auth.service';

export async function POST(req) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { email, purpose } = body || {};

    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '';
    const userAgent = req.headers.get('user-agent') || '';

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Valid email address is required.' },
        { status: 400 }
      );
    }

    if (purpose === 'SECURITY_TOKEN_RECOVERY') {
      const result = await authService.requestSecurityTokenRecovery(email, { ip, userAgent });
      return NextResponse.json(result, { status: 200 });
    } else {
      // Default purpose: PASSWORD_RESET
      const result = await authService.requestPasswordReset(email, { ip, userAgent });
      return NextResponse.json(result, { status: 200 });
    }
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message || 'Unable to process verification request.' },
      { status: 400 }
    );
  }
}
