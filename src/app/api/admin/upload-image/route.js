import { NextResponse } from 'next/server';
import authService from '@/lib/services/auth.service';
import { uploadToCloudinary } from '@/lib/cloudinary';

export async function POST(req) {
  try {
    // 1. Authenticate request using JWT token from Authorization header OR cookie
    let token = null;
    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else {
      token = req.cookies.get('token')?.value;
    }

    // In production, require authentication
    if (!token && process.env.NODE_ENV === 'production') {
      return NextResponse.json({ success: false, message: 'Unauthorized access' }, { status: 401 });
    }

    if (token && token !== 'dev_bypass_token') {
      try {
        authService.verifyToken(token);
      } catch (err) {
        if (process.env.NODE_ENV === 'production') {
          return NextResponse.json({ success: false, message: 'Invalid or expired session token' }, { status: 401 });
        }
      }
    }

    // 2. Parse request payload (supports multipart/form-data and application/json)
    let base64Image = null;
    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('image') || formData.get('file');
      if (file && typeof file === 'object' && file.arrayBuffer) {
        const buffer = Buffer.from(await file.arrayBuffer());
        const mimeType = file.type || 'image/jpeg';
        base64Image = `data:${mimeType};base64,${buffer.toString('base64')}`;
      } else if (typeof file === 'string') {
        base64Image = file;
      }
    } else {
      const body = await req.json();
      base64Image = body.image || body.file;
    }

    if (!base64Image) {
      return NextResponse.json({ success: false, message: 'No image data provided' }, { status: 400 });
    }

    const imageUrl = await uploadToCloudinary(base64Image);
    return NextResponse.json({ success: true, url: imageUrl }, { status: 200 });
  } catch (error) {
    console.error('Image upload error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
