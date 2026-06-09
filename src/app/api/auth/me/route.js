import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/middlewares/auth';

export async function GET(req) {
  try {
    const admin = await verifyAuth(req);
    return NextResponse.json({
      success: true,
      data: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        dob: admin.dob,
      },
    }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 401 });
  }
}
