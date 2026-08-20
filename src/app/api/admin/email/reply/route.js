import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/middlewares/auth';
import connectToDatabase from '@/lib/db';
import emailService from '@/lib/services/email.service';

const ALLOWED_ROLES = new Set(['editor', 'admin', 'superadmin']);

export async function POST(req) {
  try {
    const actor = await verifyAuth(req);
    if (!ALLOWED_ROLES.has(actor.role)) {
      return NextResponse.json(
        { success: false, message: 'Forbidden: Insufficient newsroom email permissions.' },
        { status: 403 }
      );
    }

    await connectToDatabase();
    const body = await req.json();
    const { originalEmailId, text, html, to, cc, bcc } = body || {};

    if (!originalEmailId || (!text && !html)) {
      return NextResponse.json(
        { success: false, message: 'Original email ID and reply message body are required.' },
        { status: 400 }
      );
    }

    const result = await emailService.sendReply({
      originalEmailId,
      text,
      html,
      to,
      cc,
      bcc,
      actor,
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Reply dispatched successfully via Resend.',
        data: result,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to dispatch reply.' },
      { status: error.message?.includes('Not authorized') ? 401 : 400 }
    );
  }
}
