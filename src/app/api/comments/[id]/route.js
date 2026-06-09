import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import commentService from '@/lib/services/comment.service';
import { verifyAuth } from '@/lib/middlewares/auth';

export async function PATCH(req, { params }) {
  try {
    const { id } = await params;
    await connectToDatabase();
    await verifyAuth(req);

    const body = await req.json();
    const { status } = body;
    if (!status) throw new Error('Missing status value');

    const comment = await commentService.updateCommentStatus(id, status);
    return NextResponse.json({ success: true, message: `Comment status updated to ${status}`, data: comment }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const { id } = await params;
    await connectToDatabase();
    await verifyAuth(req);

    const result = await commentService.deleteComment(id);
    return NextResponse.json({ success: true, ...result }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}
