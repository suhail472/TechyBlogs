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
    const { name, email, password, dob, loginToken } = body;

    if (!name || !email || !password) {
      return NextResponse.json({ success: false, message: 'Name, email, and password are required' }, { status: 400 });
    }

    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return NextResponse.json({ success: false, message: 'Admin with this email already exists' }, { status: 400 });
    }

    // Generate a login token if not explicitly provided
    const tokenToSave = loginToken || 'TB-' + Math.random().toString(36).substring(2, 8).toUpperCase();

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newAdmin = await Admin.create({
      name,
      email,
      password: hashedPassword,
      dob: dob ? new Date(dob) : undefined,
      loginToken: tokenToSave,
      role: 'admin',
      isActive: true,
    });

    return NextResponse.json({
      success: true,
      message: 'Admin created successfully',
      data: {
        id: newAdmin._id,
        name: newAdmin.name,
        email: newAdmin.email,
        loginToken: tokenToSave,
      }
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
