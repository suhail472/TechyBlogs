import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import postService from '@/lib/services/post.service';
import { verifyAuth } from '@/lib/middlewares/auth';

export async function GET(req, { params }) {
  try {
    await connectToDatabase();
    await verifyAuth(req);
    const { id } = await params;
    const post = await postService.getPostById(id);
    return NextResponse.json({ success: true, data: post }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}

export async function PUT(req, { params }) {
  try {
    await connectToDatabase();
    await verifyAuth(req);
    const { id } = await params;
    const body = await req.json();
    const result = await postService.updatePost(id, body);
    return NextResponse.json({ success: true, message: 'Post updated successfully', data: result }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}

export async function DELETE(req, { params }) {
  try {
    await connectToDatabase();
    await verifyAuth(req);
    const { id } = await params;
    const result = await postService.deletePost(id);
    return NextResponse.json({ success: true, message: result.message }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}
