import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import authService from '@/lib/services/auth.service';

export async function POST(req) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { email, password, token } = body;
    const result = await authService.login(email, password, token);
    return NextResponse.json({ success: true, message: 'Login successful', data: result }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 401 });
  }
}