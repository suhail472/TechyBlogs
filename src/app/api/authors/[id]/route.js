import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { verifyAuth } from '@/lib/middlewares/auth';
import { authorService } from '@/lib/services/author.service';

export const dynamic = 'force-dynamic';

export async function PUT(req, { params }) {
  try {
    await connectToDatabase();
    const currentUser = await verifyAuth(req);
    const { id } = await params;
    const body = await req.json();

    const author = await authorService.updateAuthor(id, body, currentUser);
    return NextResponse.json({ success: true, data: author }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}

export async function DELETE(req, { params }) {
  try {
    await connectToDatabase();
    const currentUser = await verifyAuth(req);
    const { id } = await params;

    const result = await authorService.safeDeleteOrDeactivate(id, currentUser);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}
