import Post from '../models/post.model.js';

const EDITORIAL_ROLES = new Set(['editor', 'admin', 'superadmin']);
const MODERATION_ROLES = new Set(['moderator', 'admin', 'superadmin']);

const transitions = {
  draft: ['in_review', 'archived'],
  in_review: ['approved', 'rejected', 'draft'],
  approved: ['scheduled', 'published', 'draft'],
  scheduled: ['published', 'draft', 'archived'],
  published: ['updated', 'archived'],
  updated: ['published', 'archived'],
  rejected: ['draft', 'archived'],
  archived: ['draft'],
};

export function canManageTaxonomy(user) {
  return EDITORIAL_ROLES.has(user?.role);
}

export function canModerate(user) {
  return MODERATION_ROLES.has(user?.role);
}

function isOwner(post, user) {
  return String(post.primaryAuthor || '') === String(user?._id || '') || post.author === user?.name;
}

export function canEditPost(post, user) {
  return EDITORIAL_ROLES.has(user?.role) || isOwner(post, user);
}

export function serialiseActor(user) {
  return { id: String(user._id), name: user.name, role: user.role };
}

class EditorialService {
  async create(data, user) {
    const requestedStatus = data.status || 'draft';
    const status = EDITORIAL_ROLES.has(user.role) ? requestedStatus : 'draft';
    const post = await Post.create({
      ...data,
      status,
      author: data.author || user.name,
      primaryAuthor: data.primaryAuthor || user._id,
      authors: data.authors?.length ? data.authors : [{ authorId: user._id, name: user.name, role: 'writer' }],
      publishedAt: ['published', 'updated'].includes(status) ? new Date() : data.publishedAt,
      editorialHistory: [{ action: 'created', by: serialiseActor(user), at: new Date() }],
    });
    return post;
  }

  async update(postId, data, user) {
    const post = await Post.findById(postId);
    if (!post) throw new Error('Content not found');
    if (!canEditPost(post, user)) throw new Error('You cannot edit this content');
    if (data.slug && data.slug !== post.slug && await Post.exists({ slug: data.slug })) {
      throw new Error('A post with this slug already exists');
    }
    const revision = {
      version: (post.revisions?.length || 0) + 1,
      title: post.title,
      excerpt: post.excerpt,
      content: post.content,
      changedBy: serialiseActor(user),
      createdAt: new Date(),
    };
    const blocked = ['status', 'publishedAt', 'scheduledAt'];
    for (const [key, value] of Object.entries(data)) {
      if (!blocked.includes(key)) post[key] = value;
    }
    post.revisions.push(revision);
    post.editorialHistory.push({ action: 'edited', by: serialiseActor(user), at: new Date() });
    await post.save();
    return post;
  }

  async transition(postId, nextStatus, user, note = '', scheduledAt) {
    const post = await Post.findById(postId);
    if (!post) throw new Error('Content not found');
    if (!transitions[post.status]?.includes(nextStatus)) throw new Error(`Cannot move ${post.status} content to ${nextStatus}`);
    if (!canEditPost(post, user)) throw new Error('You cannot change this content');
    const requiresEditor = ['approved', 'scheduled', 'published', 'archived'].includes(nextStatus);
    if (requiresEditor && !EDITORIAL_ROLES.has(user.role)) throw new Error('An editor is required for this editorial action');
    if (nextStatus === 'scheduled' && (!scheduledAt || new Date(scheduledAt) <= new Date())) {
      throw new Error('Scheduled publishing requires a future date and time');
    }
    // “Updated” is a public editorial event, not a visibility state. Keep the
    // document published so readers, feeds, and canonical URLs stay stable.
    post.status = nextStatus === 'updated' ? 'published' : nextStatus;
    post.editorialNotes = note || post.editorialNotes;
    if (nextStatus === 'in_review') post.submittedAt = new Date();
    if (nextStatus === 'approved') post.approvedAt = new Date();
    if (nextStatus === 'scheduled') post.scheduledAt = new Date(scheduledAt);
    if (nextStatus === 'published') { post.publishedAt = new Date(); post.scheduledAt = undefined; }
    if (nextStatus === 'archived') post.archivedAt = new Date();
    post.editorialHistory.push({ action: nextStatus, by: serialiseActor(user), note, at: new Date() });
    await post.save();
    return post;
  }

  async publishDueContent(now = new Date()) {
    return Post.updateMany(
      { status: 'scheduled', scheduledAt: { $lte: now } },
      { $set: { status: 'published', publishedAt: now }, $unset: { scheduledAt: '' } },
    );
  }
}

export const editorialService = new EditorialService();
