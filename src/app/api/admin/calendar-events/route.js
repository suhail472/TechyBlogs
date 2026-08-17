import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { verifyAuth } from '@/lib/middlewares/auth';
import { calendarService } from '@/lib/services/calendar.service';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    await connectToDatabase();
    await verifyAuth(req);

    const { searchParams } = new URL(req.url);
    const params = {
      start: searchParams.get('start'),
      end: searchParams.get('end'),
      desk: searchParams.get('desk') || 'all',
      bureau: searchParams.get('bureau') || 'all',
      author: searchParams.get('author') || 'all',
      status: searchParams.get('status') || 'all',
      priority: searchParams.get('priority') || 'all',
      search: searchParams.get('search') || '',
    };

    // Backward compatibility for legacy month/year queries
    const month = parseInt(searchParams.get('month'), 10);
    const year = parseInt(searchParams.get('year'), 10);
    if (!params.start && !isNaN(month) && !isNaN(year)) {
      params.start = new Date(Date.UTC(year, month, 1)).toISOString();
      params.end = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59)).toISOString();
    }

    const feed = await calendarService.getCalendarFeed(params);
    return NextResponse.json({ success: true, ...feed });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}

export async function POST(req) {
  try {
    await connectToDatabase();
    const user = await verifyAuth(req);
    const body = await req.json();
    const { action, postId, data } = body;

    if (!postId) {
      return NextResponse.json({ success: false, message: 'postId is required' }, { status: 400 });
    }

    let result;
    if (action === 'schedule') {
      result = await calendarService.scheduleStory(postId, data, user);
    } else if (action === 'reschedule') {
      result = await calendarService.rescheduleStory(postId, data.scheduledAt, user);
    } else if (action === 'update_planning') {
      result = await calendarService.updatePlanning(postId, data, user);
    } else {
      return NextResponse.json({ success: false, message: `Unknown calendar action: ${action}` }, { status: 400 });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}
