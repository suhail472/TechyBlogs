import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import postService from '@/lib/services/post.service';
import { verifyAuth } from '@/lib/middlewares/auth';

export async function GET(req) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const filters = Object.fromEntries(searchParams.entries());
    const result = await postService.getAllPosts(filters);
    return NextResponse.json({ success: true, ...result }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}

export async function POST(req) {
  try {
    await connectToDatabase();
    await verifyAuth(req);
    const body = await req.json();
    const result = await postService.createPost(body);
    return NextResponse.json({ success: true, message: 'Post created successfully', data: result }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}