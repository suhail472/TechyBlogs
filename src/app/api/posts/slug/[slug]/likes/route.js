import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Post from '@/lib/models/post.model';

export async function POST(req, { params }) {
  try {
    const { slug } = await params;
    await connectToDatabase();

    const post = await Post.findOne({ slug, status: 'published' });
    if (!post) throw new Error('Post not found');

    post.likes = (post.likes || 0) + 1;
    await post.save();

    return NextResponse.json({ success: true, likes: post.likes }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}
