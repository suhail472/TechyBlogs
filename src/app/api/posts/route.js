import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import postService from '@/lib/services/post.service';
import { verifyAuth } from '@/lib/middlewares/auth';
import { editorialService } from '@/lib/services/editorial.service';
import { DEFAULT_STORIES } from '@/data/defaultStories';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const filters = Object.fromEntries(searchParams.entries());
    if (filters.status === 'all') await verifyAuth(req);

    try {
      await connectToDatabase();
      const result = await postService.getAllPosts(filters);
      if (result && result.posts && result.posts.length > 0) {
        return NextResponse.json({ success: true, ...result }, { status: 200 });
      }
    } catch (dbErr) {
      console.warn('Database error in getAllPosts, using fallback:', dbErr.message);
    }

    // Fallback to DEFAULT_STORIES
    let posts = [...DEFAULT_STORIES];
    if (filters.category && filters.category !== 'All') {
      posts = posts.filter((p) => p.categories?.includes(filters.category));
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      posts = posts.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.excerpt.toLowerCase().includes(q) ||
          p.author.toLowerCase().includes(q)
      );
    }

    const page = parseInt(filters.page || '1', 10);
    const limit = parseInt(filters.limit || '12', 10);
    const total = posts.length;
    const paginated = posts.slice((page - 1) * limit, page * limit);

    return NextResponse.json(
      {
        success: true,
        posts: paginated,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit) || 1,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}

export async function POST(req) {
  try {
    await connectToDatabase();
    const user = await verifyAuth(req);
    const body = await req.json();
    const result = await editorialService.create(body, user);
    return NextResponse.json({ success: true, message: 'Post created successfully', data: result }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}