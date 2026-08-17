import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { verifyAuth } from '@/lib/middlewares/auth';
import { authorService } from '@/lib/services/author.service';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    await connectToDatabase();
    const user = await verifyAuth(req);

    const body = await req.json();
    const { sourceAuthorId, targetAuthorId } = body;

    if (!sourceAuthorId || !targetAuthorId) {
      return NextResponse.json(
        { success: false, message: 'Both sourceAuthorId and targetAuthorId are required' },
        { status: 400 }
      );
    }

    const result = await authorService.transferArticles(sourceAuthorId, targetAuthorId, user);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}
