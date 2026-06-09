import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import authService from '@/lib/services/auth.service';

export async function POST(req) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { name, email, dob, newPassword } = body;

    if (!name || !email || !dob || !newPassword) {
      return NextResponse.json({ success: false, message: 'All fields are required' }, { status: 400 });
    }

    const result = await authService.resetPasswordByInfo(name, email, dob, newPassword);
    return NextResponse.json({ success: true, message: result.message }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}
