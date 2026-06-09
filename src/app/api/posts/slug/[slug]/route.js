import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import postService from '@/lib/services/post.service';

export async function GET(req, { params }) {
  try {
    await connectToDatabase();
    const { slug } = await params;
    const result = await postService.getPostBySlug(slug);
    return NextResponse.json({ success: true, data: result }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 404 });
  }
}
