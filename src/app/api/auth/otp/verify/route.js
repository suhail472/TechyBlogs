import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import otpService from '@/lib/services/otp.service';

export async function POST(req) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { email, otp, purpose } = body || {};

    if (!email || !otp) {
      return NextResponse.json(
        { success: false, message: 'Email and 6-digit code are required.' },
        { status: 400 }
      );
    }

    const result = await otpService.verifyOtp({
      email,
      otp,
      purpose: purpose || 'PASSWORD_RESET',
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Verification code confirmed successfully.',
        data: result,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message || 'Verification failed.' },
      { status: 400 }
    );
  }
}
