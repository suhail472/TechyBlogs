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
      const comments = await commentService.getCommentsBySlug(slug);
      return NextResponse.json({ success: true, comments }, { status: 200 });
    }

    // Require admin authentication to list moderation queue
    await verifyAuth(req);
    const filters = {
      status: searchParams.get('status') || 'all',
      desk: searchParams.get('desk') || 'all',
      search: searchParams.get('search') || '',
      sort: searchParams.get('sort') || 'needs_attention',
      page: parseInt(searchParams.get('page'), 10) || 1,
      limit: parseInt(searchParams.get('limit'), 10) || 25,
    };

    const result = await commentService.getModerationQueue(filters);
    return NextResponse.json({ success: true, ...result }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}

export async function POST(req) {
  try {
    await connectToDatabase();
    const rawIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1';

    let actor = null;
    try {
      actor = await verifyAuth(req);
    } catch (e) {
      // Anonymous public commenter is permitted
    }

    const body = await req.json();
    const result = await commentService.createComment(body, actor, rawIp);
    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}
