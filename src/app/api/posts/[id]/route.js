import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Post from '@/lib/models/post.model';
import postService from '@/lib/services/post.service';
import { verifyAuth } from '@/lib/middlewares/auth';
import { editorialService, canEditPost } from '@/lib/services/editorial.service';

export async function GET(req, { params }) {
  try {
    await connectToDatabase();
    const user = await verifyAuth(req);
    const { id } = await params;
    const post = await postService.getPostById(id);
    if (!canEditPost(post, user)) {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json({ success: true, data: post }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}

export async function PUT(req, { params }) {
  try {
    await connectToDatabase();
    const user = await verifyAuth(req);
    const { id } = await params;
    const body = await req.json();
    const result = await editorialService.update(id, body, user);
    return NextResponse.json({ success: true, message: 'Post updated successfully', data: result }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}

export async function DELETE(req, { params }) {
  try {
    await connectToDatabase();
    const user = await verifyAuth(req);
    const { id } = await params;
    const post = await Post.findById(id);
    if (!post) {
      return NextResponse.json({ success: false, message: 'Post not found' }, { status: 404 });
    }
    if (!canEditPost(post, user)) {
      return NextResponse.json({ success: false, message: 'You do not have permission to delete this post' }, { status: 403 });
    }
    const result = await postService.deletePost(id);
    return NextResponse.json({ success: true, message: result.message }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}
