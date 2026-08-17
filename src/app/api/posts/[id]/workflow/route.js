import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { verifyAuth } from '@/lib/middlewares/auth';
import { editorialService } from '@/lib/services/editorial.service';

export async function POST(req, { params }) {
  try {
    await connectToDatabase();
    const user = await verifyAuth(req);
    const { id } = await params;
    const body = await req.json();
    const targetStatus = body.nextStatus || body.status;
    if (!targetStatus) {
      return NextResponse.json({ success: false, message: 'Target status is required' }, { status: 400 });
    }
    const post = await editorialService.transition(id, targetStatus, user, body.note || '', body.scheduledAt);
    return NextResponse.json({ success: true, data: post });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}
