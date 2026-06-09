import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import postService from '@/lib/services/post.service';

export async function GET(req, { params }) {
  try {
    await connectToDatabase();
    const { category } = await params;
    const { searchParams } = new URL(req.url);
    const page = searchParams.get('page') || 1;
    const limit = searchParams.get('limit') || 10;
    
    const result = await postService.getPostsByCategory(category, page, limit);
    return NextResponse.json({ success: true, ...result }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}
