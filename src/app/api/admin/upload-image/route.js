import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { uploadToCloudinary } from '@/lib/cloudinary';

export async function POST(req) {
  try {
    // Authenticate request using JWT token
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, message: 'Unauthorized access' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    try {
      jwt.verify(token, process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production');
    } catch (err) {
      return NextResponse.json({ success: false, message: 'Invalid or expired session token' }, { status: 401 });
    }

    const body = await req.json();
    const { image } = body;
    if (!image) {
      return NextResponse.json({ success: false, message: 'No image data provided' }, { status: 400 });
    }

    const imageUrl = await uploadToCloudinary(image);
    return NextResponse.json({ success: true, url: imageUrl }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
