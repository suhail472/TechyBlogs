import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import subscriberService from '@/lib/services/subscriber.service';
import Subscriber from '@/lib/models/subscriber.model';
import { verifyAuth } from '@/lib/middlewares/auth';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    await connectToDatabase();
    await verifyAuth(req);

    const { searchParams } = new URL(req.url);
    const filters = {
      status: searchParams.get('status') || 'all',
      edition: searchParams.get('edition') || 'all',
      topic: searchParams.get('topic') || 'all',
      source: searchParams.get('source') || 'all',
      search: searchParams.get('search') || '',
      sort: searchParams.get('sort') || 'newest',
      page: parseInt(searchParams.get('page'), 10) || 1,
      limit: parseInt(searchParams.get('limit'), 10) || 20,
    };

    const result = await subscriberService.getSubscribersList(filters);
    return NextResponse.json({ success: true, ...result }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 401 });
  }
}

export async function PATCH(req) {
  try {
    await connectToDatabase();
    const actor = await verifyAuth(req);

    const body = await req.json();
    const { id, action, reason } = body;

    if (action === 'suppress') {
      const result = await subscriberService.suppressSubscriber(id, reason, actor);
      return NextResponse.json(result, { status: 200 });
    }

    if (action === 'restore') {
      const result = await subscriberService.restoreSubscriber(id, actor);
      return NextResponse.json(result, { status: 200 });
    }

    throw new Error(`Unsupported action: ${action}`);
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}

export async function DELETE(req) {
  try {
    await connectToDatabase();
    const actor = await verifyAuth(req);

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) throw new Error('Missing subscriber ID');

    const sub = await Subscriber.findByIdAndDelete(id);
    if (!sub) throw new Error('Subscriber not found');

    return NextResponse.json({ success: true, message: 'Subscriber deleted successfully' }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}
