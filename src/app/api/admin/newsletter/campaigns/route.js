import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { verifyAuth } from '@/lib/middlewares/auth';
import NewsletterCampaign from '@/lib/models/campaign.model';
import { subscriberService } from '@/lib/services/subscriber.service';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    await connectToDatabase();
    await verifyAuth(req);

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'all';

    const query = {};
    if (status !== 'all') query.status = status;

    const campaigns = await NewsletterCampaign.find(query)
      .populate('createdBy', 'name role')
      .populate('content.featuredStories.post', 'title slug primarySection')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, campaigns }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}

export async function POST(req) {
  try {
    await connectToDatabase();
    const actor = await verifyAuth(req);

    const body = await req.json();
    const campaign = await subscriberService.createCampaign(body, actor);

    return NextResponse.json({ success: true, campaign }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}
