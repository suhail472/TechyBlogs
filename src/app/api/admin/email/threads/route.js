import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/middlewares/auth';
import connectToDatabase from '@/lib/db';
import emailService from '@/lib/services/email.service';

const ALLOWED_ROLES = new Set(['editor', 'admin', 'superadmin']);

export async function GET(req) {
  try {
    const actor = await verifyAuth(req);
    if (!ALLOWED_ROLES.has(actor.role)) {
      return NextResponse.json(
        { success: false, message: 'Forbidden: Insufficient newsroom email permissions.' },
        { status: 403 }
      );
    }

    await connectToDatabase();
    const { searchParams } = new URL(req.url);

    const folder = searchParams.get('folder') || 'inbox';
    const label = searchParams.get('label') || '';
    const isStarred = searchParams.get('isStarred');
    const isUnread = searchParams.get('isUnread');
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page'), 10) || 1;
    const limit = parseInt(searchParams.get('limit'), 10) || 25;
    const sortBy = searchParams.get('sortBy') || 'lastActivity';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const [result, counts] = await Promise.all([
      emailService.getThreads({
        folder,
        label,
        isStarred,
        isUnread,
        search,
        page,
        limit,
        sortBy,
        sortOrder,
      }),
      emailService.getFolderCounts(),
    ]);

    return NextResponse.json(
      {
        success: true,
        data: result.threads,
        pagination: result.pagination,
        counts,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch email conversations.' },
      { status: error.message?.includes('Not authorized') ? 401 : 500 }
    );
  }
}
