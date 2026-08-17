import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { verifyAuth } from '@/lib/middlewares/auth';
import { canManageTaxonomy } from '@/lib/services/editorial.service';
import { taxonomyService } from '@/lib/services/taxonomy.service';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    await connectToDatabase();
    const user = await verifyAuth(req);
    if (!canManageTaxonomy(user)) {
      return NextResponse.json({ success: false, message: 'Editorial privileges required to reassign articles' }, { status: 403 });
    }

    const body = await req.json();
    const { sourceId, targetId } = body;

    if (!sourceId || !targetId) {
      return NextResponse.json(
        { success: false, message: 'Both sourceId and targetId are required' },
        { status: 400 }
      );
    }

    const result = await taxonomyService.reassignArticles(sourceId, targetId, user);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}
