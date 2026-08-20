import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/middlewares/auth';
import connectToDatabase from '@/lib/db';
import emailService from '@/lib/services/email.service';

const ALLOWED_ROLES = new Set(['editor', 'admin', 'superadmin']);

export async function PATCH(req) {
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
    const { threadId, messageIds, action, value } = body || {};

    if (!action || (!threadId && (!messageIds || !messageIds.length))) {
      return NextResponse.json(
        { success: false, message: 'Target thread/messages and action are required.' },
        { status: 400 }
      );
    }

    const result = await emailService.performThreadAction({
      threadId,
      messageIds,
      action,
      value,
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Action completed successfully.',
        data: result,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message || 'Action failed.' },
      { status: error.message?.includes('Not authorized') ? 401 : 400 }
    );
  }
}
