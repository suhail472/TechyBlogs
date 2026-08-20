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
    const { to, subject, html, text, cc, bcc, labels } = body || {};

    if (!to || (!text && !html)) {
      return NextResponse.json(
        { success: false, message: 'Recipient and message content are required.' },
        { status: 400 }
      );
    }

    const result = await emailService.sendEmail({
      to,
      subject: subject || '(No Subject)',
      html,
      text,
      cc,
      bcc,
      actor,
      labels: labels || ['Newsroom'],
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Email dispatched successfully via Resend.',
        data: result,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to send outbound email.' },
      { status: error.message?.includes('Not authorized') ? 401 : 400 }
    );
  }
}
