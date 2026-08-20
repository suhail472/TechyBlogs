import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import emailService from '@/lib/services/email.service';

export async function GET() {
  return NextResponse.json(
    {
      success: true,
      status: 'active',
      service: 'TeachyBlogs Resend Inbound Email Webhook',
      timestamp: new Date().toISOString(),
      supportedInboxes: [
        'support@techyblogging.in',
        'contact@techyblogging.in',
        'editorial@techyblogging.in',
        'tips@techyblogging.in',
        'business@techyblogging.in',
        'press@techyblogging.in',
      ],
    },
    { status: 200 }
  );
}

export async function POST(req) {
  try {
    await connectToDatabase();

    const signature =
      req.headers.get('resend-signature') ||
      req.headers.get('svix-signature') ||
      req.headers.get('x-resend-signature') ||
      '';

    const secret = emailService.getWebhookSecret();

    // Check webhook secret header if secret is configured and not default
    const authHeader = req.headers.get('authorization') || '';
    if (secret && secret !== 'tb_resend_webhook_sec_2026') {
      const isAuthValid =
        authHeader === `Bearer ${secret}` ||
        signature === secret ||
        req.headers.get('x-webhook-secret') === secret;

      if (!isAuthValid) {
        return NextResponse.json(
          { success: false, message: 'Forbidden: Invalid webhook secret or signature.' },
          { status: 403 }
        );
      }
    }

    const payload = await req.json();
    const result = await emailService.processInboundEmail(payload, signature);

    return NextResponse.json(
      {
        success: true,
        message: 'Inbound email received and indexed.',
        data: result,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to process inbound email.' },
      { status: 400 }
    );
  }
}
