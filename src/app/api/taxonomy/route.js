import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Taxonomy from '@/lib/models/taxonomy.model';
import { verifyAuth } from '@/lib/middlewares/auth';
import { canManageTaxonomy } from '@/lib/services/editorial.service';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const kind = searchParams.get('kind');
    const navigation = searchParams.get('navigation') === 'true';
    const query = { active: true };
    if (kind) query.kind = kind;
    if (navigation) query.visibleInNavigation = true;
    const items = await Taxonomy.find(query).sort({ order: 1, name: 1 }).lean();
    return NextResponse.json({ success: true, data: items });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}

export async function POST(req) {
  try {
    await connectToDatabase();
    const user = await verifyAuth(req);
    if (!canManageTaxonomy(user)) {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }
    const body = await req.json();
    const item = await Taxonomy.create(body);
    return NextResponse.json({ success: true, data: item }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}
