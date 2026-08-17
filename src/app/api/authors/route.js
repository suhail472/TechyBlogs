import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { verifyAuth } from '@/lib/middlewares/auth';
import { authorService } from '@/lib/services/author.service';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const filters = {
      bureau: searchParams.get('bureau') || 'all',
      status: searchParams.get('status') || 'all',
      role: searchParams.get('role') || 'all',
      desk: searchParams.get('desk') || 'all',
      search: searchParams.get('search') || '',
    };

    const authors = await authorService.getAllAuthors(filters);
    return NextResponse.json({ success: true, count: authors.length, data: authors });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}

export async function POST(req) {
  try {
    await connectToDatabase();
    const currentUser = await verifyAuth(req);
    const body = await req.json();

    const author = await authorService.createAuthor(body, currentUser);
    return NextResponse.json({ success: true, data: author }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}
