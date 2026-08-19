import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Post from '@/lib/models/post.model';

export async function POST(req, { params }) {
  try {
    const { slug } = await params;
    await connectToDatabase();

    const normalizedSlug = decodeURIComponent(slug).trim();
    const cleanSlug = normalizedSlug.replace(/^-+/, '');
    const slugVariants = [
      normalizedSlug,
      cleanSlug,
      `-${cleanSlug}`,
    ];

    const post = await Post.findOne({
      slug: { $in: slugVariants },
      status: 'published',
    });
    if (!post) throw new Error('Post not found');

    const body = await req.json().catch(() => ({}));
    const action = body.action || 'like';

    if (action === 'unlike') {
      post.likes = Math.max(0, (post.likes || 0) - 1);
    } else {
      post.likes = (post.likes || 0) + 1;
    }

    await post.save();

    return NextResponse.json({ success: true, likes: post.likes }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}
