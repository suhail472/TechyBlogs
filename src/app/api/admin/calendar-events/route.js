import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Post from '@/lib/models/post.model';
import { verifyAuth } from '@/lib/middlewares/auth';

export async function GET(req) {
  try {
    await connectToDatabase();
    await verifyAuth(req);

    const { searchParams } = new URL(req.url);
    const month = parseInt(searchParams.get('month'), 10);
    const year = parseInt(searchParams.get('year'), 10);

    let dateFilter = {};
    if (!isNaN(month) && !isNaN(year)) {
      const startDate = new Date(Date.UTC(year, month, 1));
      const endDate = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59));
      dateFilter = {
        $or: [
          { publishedAt: { $gte: startDate, $lte: endDate } },
          { scheduledAt: { $gte: startDate, $lte: endDate } },
          { createdAt: { $gte: startDate, $lte: endDate } },
        ],
      };
    }

    const posts = await Post.find(dateFilter)
      .select('title slug status contentType publishedAt scheduledAt author createdAt categories')
      .sort({ publishedAt: -1, scheduledAt: -1, createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, data: posts });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}
