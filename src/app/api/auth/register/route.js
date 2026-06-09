import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import authService from '@/lib/services/auth.service';

export async function POST(req) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const result = await authService.register(body);
    return NextResponse.json({ success: true, message: 'Admin registered successfully', data: result }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}