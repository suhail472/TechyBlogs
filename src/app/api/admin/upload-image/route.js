import { NextResponse } from 'next/server';
import authService from '@/lib/services/auth.service';
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
      authService.verifyToken(token);
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
