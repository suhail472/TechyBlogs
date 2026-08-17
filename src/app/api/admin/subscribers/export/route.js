import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { verifyAuth } from '@/lib/middlewares/auth';
import { subscriberService } from '@/lib/services/subscriber.service';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    await connectToDatabase();
    const actor = await verifyAuth(req);

    const { searchParams } = new URL(req.url);
    const filters = {
      status: searchParams.get('status') || 'all',
      edition: searchParams.get('edition') || 'all',
      topic: searchParams.get('topic') || 'all',
    };

    const csvData = await subscriberService.exportSubscribersCSV(filters, actor);

    return new NextResponse(csvData, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="teachyblogs_subscribers_${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}
