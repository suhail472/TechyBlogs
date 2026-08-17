import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { verifyAuth } from '@/lib/middlewares/auth';
import Post from '@/lib/models/post.model';
import { validatePublicationIntegrity, serialiseActor } from '@/lib/services/editorial.service';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    await connectToDatabase();
    const user = await verifyAuth(req);

    const body = await req.json();
    const { action, postIds = [], data = {} } = body;

    if (!Array.isArray(postIds) || postIds.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No article IDs provided for bulk operation' },
        { status: 400 }
      );
    }

    const actor = serialiseActor(user);

    switch (action) {
      case 'publish': {
        const posts = await Post.find({ _id: { $in: postIds } });
        const results = { published: 0, failed: [] };

        for (const post of posts) {
          const validation = validatePublicationIntegrity(post);
          if (!validation.isValid) {
            results.failed.push({ id: post._id, title: post.title, issues: validation.issues });
          } else {
            post.status = 'published';
            post.publishedAt = post.publishedAt || new Date();
            post.editorialHistory.push({
              action: 'published',
              by: actor,
              note: 'Bulk published from Newsroom Command Center',
              at: new Date(),
            });
            await post.save();
            results.published++;
          }
        }

        return NextResponse.json({
          success: true,
          message: `Successfully published ${results.published} of ${posts.length} stories.`,
          results,
        });
      }

      case 'archive': {
        await Post.updateMany(
          { _id: { $in: postIds } },
          {
            $set: { status: 'archived', archivedAt: new Date() },
            $push: {
              editorialHistory: {
                action: 'archived',
                by: actor,
                note: 'Bulk archived from Newsroom Command Center',
                at: new Date(),
              },
            },
          }
        );
        return NextResponse.json({
          success: true,
          message: `Successfully moved ${postIds.length} stories to archive.`,
        });
      }

      case 'draft': {
        await Post.updateMany(
          { _id: { $in: postIds } },
          {
            $set: { status: 'draft' },
            $push: {
              editorialHistory: {
                action: 'draft',
                by: actor,
                note: 'Moved to draft from Newsroom Command Center',
                at: new Date(),
              },
            },
          }
        );
        return NextResponse.json({
          success: true,
          message: `Successfully moved ${postIds.length} stories to draft.`,
        });
      }

      case 'change_desk': {
        if (!data.desk) {
          return NextResponse.json({ success: false, message: 'New desk section is required' }, { status: 400 });
        }
        await Post.updateMany(
          { _id: { $in: postIds } },
          {
            $set: { primarySection: data.desk, categories: [data.desk] },
            $push: {
              editorialHistory: {
                action: 'edited',
                by: actor,
                note: `Desk reassigned to ${data.desk}`,
                at: new Date(),
              },
            },
          }
        );
        return NextResponse.json({
          success: true,
          message: `Successfully assigned ${postIds.length} stories to ${data.desk} desk.`,
        });
      }

      case 'assign_author': {
        if (!data.author) {
          return NextResponse.json({ success: false, message: 'Author byline is required' }, { status: 400 });
        }
        await Post.updateMany(
          { _id: { $in: postIds } },
          {
            $set: { author: data.author },
            $push: {
              editorialHistory: {
                action: 'edited',
                by: actor,
                note: `Author byline updated to ${data.author}`,
                at: new Date(),
              },
            },
          }
        );
        return NextResponse.json({
          success: true,
          message: `Successfully assigned ${postIds.length} stories to ${data.author}.`,
        });
      }

      case 'delete': {
        const deleted = await Post.deleteMany({ _id: { $in: postIds } });
        return NextResponse.json({
          success: true,
          message: `Permanently deleted ${deleted.deletedCount} stories.`,
        });
      }

      default:
        return NextResponse.json({ success: false, message: `Unknown bulk action: ${action}` }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in bulk operations route:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}
