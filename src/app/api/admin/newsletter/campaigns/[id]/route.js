import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { verifyAuth } from '@/lib/middlewares/auth';
import NewsletterCampaign from '@/lib/models/campaign.model';
import { subscriberService } from '@/lib/services/subscriber.service';

export const dynamic = 'force-dynamic';

export async function GET(req, { params }) {
  try {
    const { id } = await params;
    await connectToDatabase();
    await verifyAuth(req);

    const campaign = await NewsletterCampaign.findById(id)
      .populate('createdBy', 'name role')
      .populate('content.featuredStories.post', 'title slug primarySection image categories')
      .lean();

    if (!campaign) throw new Error('Campaign not found');

    return NextResponse.json({ success: true, campaign }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}

export async function PATCH(req, { params }) {
  try {
    const { id } = await params;
    await connectToDatabase();
    const actor = await verifyAuth(req);

    const body = await req.json();
    const campaign = await subscriberService.updateCampaign(id, body, actor);

    return NextResponse.json({ success: true, campaign }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}

export async function POST(req, { params }) {
  try {
    const { id } = await params;
    await connectToDatabase();
    const actor = await verifyAuth(req);

    const body = await req.json();
    const { action, testEmail } = body;

    if (action === 'test') {
      const result = await subscriberService.sendTestEmail(id, testEmail, actor);
      return NextResponse.json(result, { status: 200 });
    }

    if (action === 'send') {
      const result = await subscriberService.sendCampaign(id, actor);
      return NextResponse.json(result, { status: 200 });
    }

    throw new Error(`Unsupported action: ${action}`);
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}
