import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Post from '@/lib/models/post.model';
import { verifyAuth } from '@/lib/middlewares/auth';
import { canEditPost } from '@/lib/services/editorial.service';

export async function GET(req, { params }) {
  try {
    await connectToDatabase();
    const user = await verifyAuth(req);
    const { id } = await params;

    const post = await Post.findById(id).select('revisions title author primaryAuthor');
    if (!post) return NextResponse.json({ success: false, message: 'Article not found' }, { status: 404 });
    if (!canEditPost(post, user)) return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });

    return NextResponse.json({ success: true, count: post.revisions?.length || 0, data: post.revisions || [] });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}

export async function POST(req, { params }) {
  try {
    await connectToDatabase();
    const user = await verifyAuth(req);
    const { id } = await params;
    const { version } = await req.json();

    const post = await Post.findById(id);
    if (!post) return NextResponse.json({ success: false, message: 'Article not found' }, { status: 404 });
    if (!canEditPost(post, user)) return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });

    const targetRevision = (post.revisions || []).find((r) => r.version === version);
    if (!targetRevision) return NextResponse.json({ success: false, message: `Revision version ${version} not found` }, { status: 404 });

    // Revert content and excerpt to target revision
    post.title = targetRevision.title || post.title;
    post.content = targetRevision.content;
    post.excerpt = targetRevision.excerpt || post.excerpt;

    // Record roll-back revision
    const newVersion = (post.revisions?.length || 0) + 1;
    post.revisions.push({
      version: newVersion,
      title: post.title,
      excerpt: post.excerpt,
      content: post.content,
      changedBy: { id: String(user._id), name: user.name, role: user.role },
      changeSummary: `Restored from revision v${version}`,
      createdAt: new Date(),
    });

    await post.save();
    return NextResponse.json({ success: true, message: `Successfully restored revision v${version}`, data: post });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}
