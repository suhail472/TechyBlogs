import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Admin from '@/lib/models/admin.model';
import bcrypt from 'bcryptjs';

export async function POST(req, { params }) {
  try {
    const resolvedParams = await params;
    const secret = resolvedParams.secret;
    if (secret !== '9797935307@admin') {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    await connectToDatabase();
    const body = await req.json();
    const { email, password, loginToken } = body;

    if (!email || !password) {
      return NextResponse.json({ success: false, message: 'Email and password are required' }, { status: 400 });
    }

    const admin = await Admin.findOne({ email });
    if (!admin) {
      return NextResponse.json({ success: false, message: 'Admin not found' }, { status: 404 });
    }

    // Generate or update token
    const tokenToSave = loginToken || 'TB-' + Math.random().toString(36).substring(2, 8).toUpperCase();

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    admin.password = hashedPassword;
    admin.loginToken = tokenToSave;
    admin.isActive = true;
    await admin.save();

    return NextResponse.json({
      success: true,
      message: 'Admin account restored successfully',
      data: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        loginToken: tokenToSave,
      }
    }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
