import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import commentService from '@/lib/services/comment.service';
import { verifyAuth } from '@/lib/middlewares/auth';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get('slug');

    if (slug) {
      const comments = await commentService.getCommentsBySlug(slug, true);
      return NextResponse.json({ success: true, comments }, { status: 200 });
    }

    // Require admin authentication to list all comments for moderation
    await verifyAuth(req);
    const status = searchParams.get('status') || '';
    const page = searchParams.get('page') || 1;
    const limit = searchParams.get('limit') || 20;

    const result = await commentService.getAllComments({ status, page, limit });
    return NextResponse.json({ success: true, ...result }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}

export async function POST(req) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const result = await commentService.createComment(body);
    return NextResponse.json({ success: true, message: 'Comment submitted for review', data: result }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}
