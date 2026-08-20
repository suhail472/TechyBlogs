import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/middlewares/auth';
import connectToDatabase from '@/lib/db';
import emailService from '@/lib/services/email.service';

const ALLOWED_ROLES = new Set(['editor', 'admin', 'superadmin']);

export async function GET(req, { params }) {
  try {
    const actor = await verifyAuth(req);
    if (!ALLOWED_ROLES.has(actor.role)) {
      return NextResponse.json(
        { success: false, message: 'Forbidden: Insufficient newsroom email permissions.' },
        { status: 403 }
      );
    }

    await connectToDatabase();
    const resolvedParams = await params;
    const threadId = resolvedParams.id;

    if (!threadId) {
      return NextResponse.json(
        { success: false, message: 'Thread ID is required.' },
        { status: 400 }
      );
    }

    const messages = await emailService.getThreadMessages(threadId);

    return NextResponse.json(
      {
        success: true,
        data: messages,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch conversation thread.' },
      { status: error.message?.includes('Not authorized') ? 401 : 404 }
    );
  }
}
