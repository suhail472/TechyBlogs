import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import postService from '@/lib/services/post.service';

export async function GET(req) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q');
    const page = searchParams.get('page') || 1;
    const limit = searchParams.get('limit') || 10;

    if (!query) {
      return NextResponse.json({ success: false, message: 'Search term is required' }, { status: 400 });
    }

    const result = await postService.searchPosts(query, page, limit);
    return NextResponse.json({ success: true, ...result }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}
