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
      return NextResponse.json({ success: false, message: 'Editorial privileges required to merge tags' }, { status: 403 });
    }

    const body = await req.json();
    const { sourceTag, targetTag } = body;

    if (!sourceTag || !targetTag) {
      return NextResponse.json(
        { success: false, message: 'Both sourceTag and targetTag are required' },
        { status: 400 }
      );
    }

    const result = await taxonomyService.mergeTags(sourceTag, targetTag, user);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}
