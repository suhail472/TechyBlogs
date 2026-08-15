import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { verifyAuth } from '@/lib/middlewares/auth';
import { editorialService } from '@/lib/services/editorial.service';

export async function POST(req, { params }) {
  try {
    await connectToDatabase();
    const user = await verifyAuth(req);
    const { id } = await params;
    const { status, note, scheduledAt } = await req.json();
    const post = await editorialService.transition(id, status, user, note, scheduledAt);
    return NextResponse.json({ success: true, data: post });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}
