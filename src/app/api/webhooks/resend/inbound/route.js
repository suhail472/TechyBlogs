import { NextResponse } from 'next/server';
import crypto from 'crypto';
import connectToDatabase from '@/lib/db';
import emailService from '@/lib/services/email.service';

function verifySvixSignature({ rawBody, svixId, svixTimestamp, svixSignature, secret }) {
  if (!secret || !svixId || !svixTimestamp || !svixSignature) return false;

  try {
    const secretKey = secret.startsWith('whsec_') ? secret.slice(6) : secret;
    const secretBytes = Buffer.from(secretKey, 'base64');
    const toSign = `${svixId}.${svixTimestamp}.${rawBody}`;

    const expectedSig = crypto
      .createHmac('sha256', secretBytes)
      .update(toSign)
      .digest('base64');

    const signatures = svixSignature.split(' ');
    for (const versionedSig of signatures) {
      const [version, sig] = versionedSig.split(',');
      if (version === 'v1') {
        const sigBuf = Buffer.from(sig);
        const expectedBuf = Buffer.from(expectedSig);
        if (sigBuf.length === expectedBuf.length && crypto.timingSafeEqual(sigBuf, expectedBuf)) {
          return true;
        }
      }
    }
  } catch (err) {
    console.warn('[Webhook::SvixVerifyError]', err.message);
  }

  return false;
}

export async function GET() {
  return NextResponse.json(
    {
      success: true,
      status: 'active',
      service: 'TechyBlogs Resend Inbound Email Webhook',
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

    const rawBody = await req.text();
    const svixId = req.headers.get('svix-id') || '';
    const svixTimestamp = req.headers.get('svix-timestamp') || '';
    const svixSignature =
      req.headers.get('svix-signature') ||
      req.headers.get('resend-signature') ||
      '';

    const secret = emailService.getWebhookSecret();
    const authHeader = req.headers.get('authorization') || '';
    const customHeaderSecret = req.headers.get('x-webhook-secret') || '';

    // If Svix headers are present, verify cryptographic HMAC SHA-256 signature
    if (svixSignature && svixId && svixTimestamp && secret && secret.startsWith('whsec_')) {
      const isValid = verifySvixSignature({
        rawBody,
        svixId,
        svixTimestamp,
        svixSignature,
        secret,
      });

      if (!isValid) {
        return NextResponse.json(
          { success: false, message: 'Forbidden: Invalid Svix cryptographic signature.' },
          { status: 403 }
        );
      }
    } else if (secret && !secret.startsWith('whsec_') && !secret.startsWith('tb_resend')) {
      // Direct bearer or header token check (for testing and direct webhooks)
      const isAuthValid =
        authHeader === `Bearer ${secret}` ||
        svixSignature === secret ||
        customHeaderSecret === secret;

      if (!isAuthValid && (authHeader || customHeaderSecret)) {
        return NextResponse.json(
          { success: false, message: 'Forbidden: Invalid webhook authorization.' },
          { status: 403 }
        );
      }
    }

    const payload = JSON.parse(rawBody || '{}');
    const result = await emailService.processInboundEmail(payload, svixSignature);

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
