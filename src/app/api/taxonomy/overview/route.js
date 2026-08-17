import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { verifyAuth } from '@/lib/middlewares/auth';
import { taxonomyService } from '@/lib/services/taxonomy.service';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    await connectToDatabase();
    await verifyAuth(req);

    const overview = await taxonomyService.getDashboardOverview();
    return NextResponse.json({ success: true, ...overview }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}
