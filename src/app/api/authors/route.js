import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Admin from '@/lib/models/admin.model';
import Post from '@/lib/models/post.model';
import { verifyAuth } from '@/lib/middlewares/auth';

export async function GET() {
  try {
    await connectToDatabase();
    const authors = await Admin.find({ isActive: true })
      .select('-password')
      .sort({ name: 1 })
      .lean();

    // Populate article counts for each author
    const authorsWithCount = await Promise.all(
      authors.map(async (author) => {
        const postCount = await Post.countDocuments({
          $or: [
            { primaryAuthor: author._id },
            { author: author.name },
          ],
          status: 'published',
        });
        return { ...author, postCount };
      })
    );

    return NextResponse.json({ success: true, data: authorsWithCount });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}

export async function POST(req) {
  try {
    await connectToDatabase();
    const currentUser = await verifyAuth(req);
    if (!['admin', 'superadmin'].includes(currentUser?.role)) {
      return NextResponse.json({ success: false, message: 'Admin permission required to create authors' }, { status: 403 });
    }

    const body = await req.json();
    const slug = body.slug || String(body.name || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const author = await Admin.create({
      ...body,
      slug,
      role: body.role || 'author',
    });

    const sanitized = author.toObject();
    delete sanitized.password;

    return NextResponse.json({ success: true, data: sanitized }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}
