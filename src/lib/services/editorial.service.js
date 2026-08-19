import mongoose from 'mongoose';
import Post from '../models/post.model.js';
import Taxonomy from '../models/taxonomy.model.js';

const EDITORIAL_ROLES = new Set(['editor', 'admin', 'superadmin']);
const MODERATION_ROLES = new Set(['moderator', 'admin', 'superadmin']);

async function sanitizeTaxonomyFields(data) {
  const sanitized = { ...data };

  // Ensure categories is a non-empty array of strings
  if (!Array.isArray(sanitized.categories) || sanitized.categories.length === 0) {
    if (sanitized.primarySection && typeof sanitized.primarySection === 'string') {
      sanitized.categories = [sanitized.primarySection];
    } else {
      sanitized.categories = ['Technology'];
    }
  }

  // Helper to resolve an ObjectId or Taxonomy reference
  const resolveTaxonomy = async (val, kind) => {
    if (!val) return null;
    if (typeof val === 'object' && val._id) {
      return mongoose.Types.ObjectId.isValid(val._id) ? val._id : null;
    }
    if (typeof val === 'string') {
      if (mongoose.Types.ObjectId.isValid(val) && val.length === 24) {
        return val;
      }
      // String name or slug -> lookup in Taxonomy
      try {
        const slug = val.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').trim();
        const found = await Taxonomy.findOne({
          $or: [{ name: new RegExp(`^${val}$`, 'i') }, { slug }],
          ...(kind ? { kind } : {}),
        });
        if (found) return found._id;
      } catch (err) {
        // Ignore lookup errors
      }
    }
    return null;
  };

  // Resolve primarySection
  if (sanitized.primarySection !== undefined) {
    const rawSec = typeof sanitized.primarySection === 'string' ? sanitized.primarySection : sanitized.primarySection?.name;
    if (rawSec && !sanitized.categories.includes(rawSec)) {
      sanitized.categories.unshift(rawSec);
    }
    sanitized.primarySection = await resolveTaxonomy(sanitized.primarySection, 'section');
  }

  // Resolve primaryTopic
  if (sanitized.primaryTopic !== undefined) {
    sanitized.primaryTopic = await resolveTaxonomy(sanitized.primaryTopic, 'topic');
  }

  // Resolve primaryRegion
  if (sanitized.primaryRegion !== undefined) {
    sanitized.primaryRegion = await resolveTaxonomy(sanitized.primaryRegion, 'region');
  }

  // Ensure excerpt is populated and <= 500 characters
  if (!sanitized.excerpt || !sanitized.excerpt.trim()) {
    sanitized.excerpt = (
      sanitized.subtitle ||
      sanitized.seo?.description ||
      sanitized.metaDescription ||
      (sanitized.content ? sanitized.content.replace(/```[\s\S]*?```/g, ' ').replace(/[#*`~\[\]()>-]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 180) : '') ||
      sanitized.title ||
      'Article dispatch'
    ).trim().slice(0, 500);
  }

  return sanitized;
}

const transitions = {
  draft: ['in_review', 'archived', 'published'],
  in_review: ['approved', 'rejected', 'draft', 'published'],
  approved: ['scheduled', 'published', 'draft'],
  scheduled: ['published', 'draft', 'archived'],
  published: ['updated', 'archived', 'draft'],
  updated: ['published', 'archived', 'draft'],
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
  return { id: String(user?._id || ''), name: user?.name || 'Anonymous', role: user?.role || 'contributor' };
}

/**
 * Server-Side Publication Integrity Validation
 * Guarantees that invalid articles can NEVER be published even if frontend is bypassed.
 */
export function validatePublicationIntegrity(post) {
  const issues = [];
  if (!post.title || !post.title.trim()) {
    issues.push('Story headline is required for publication');
  }
  if (!post.content || !post.content.trim()) {
    issues.push('Article markdown body is required for publication');
  }
  if (!post.author || !post.author.trim()) {
    issues.push('Author byline is required for publication');
  }
  if (!post.primarySection && (!post.categories || post.categories.length === 0)) {
    issues.push('Primary editorial desk/section is required for publication');
  }
  if (!post.contentType) {
    issues.push('Content classification type is required for publication');
  }
  if (!post.image || !post.image.trim()) {
    issues.push('Featured cover image is required for publication');
  }
  if (!post.slug || !post.slug.trim()) {
    issues.push('Valid URL slug is required for publication');
  }
  const metaDesc = (post.seo?.description || post.metaDescription || post.excerpt || post.subtitle || '').trim();
  if (!metaDesc) {
    issues.push('SEO meta description is required for publication');
  }
  if (post.faqs && post.faqs.length > 0) {
    post.faqs.forEach((faq, idx) => {
      const q = (faq.question || '').trim();
      const a = (faq.answer || '').trim();
      if (!q || !a) {
        issues.push(`FAQ #${idx + 1} must have both question and answer`);
      }
    });
  }
  return {
    isValid: issues.length === 0,
    issues,
  };
}

class EditorialService {
  async create(data, user) {
    const requestedStatus = data.status || 'draft';
    const isEditor = EDITORIAL_ROLES.has(user?.role);
    const status = isEditor ? requestedStatus : 'draft';

    if (['published', 'updated', 'scheduled'].includes(status)) {
      const validation = validatePublicationIntegrity(data);
      if (!validation.isValid) {
        throw new Error(`Cannot publish article due to integrity issues: ${validation.issues.join('; ')}`);
      }
    }

    const sanitizedData = await sanitizeTaxonomyFields(data);

    const post = await Post.create({
      ...sanitizedData,
      status,
      author: sanitizedData.author || user?.name || 'Editorial Bureau',
      primaryAuthor: sanitizedData.primaryAuthor || user?._id,
      authors: sanitizedData.authors?.length ? sanitizedData.authors : [{ authorId: user?._id, name: user?.name || 'Editorial Bureau', role: 'writer' }],
      publishedAt: ['published', 'updated'].includes(status) ? (sanitizedData.publishedAt || new Date()) : sanitizedData.publishedAt,
      editorialHistory: [{ action: 'created', by: serialiseActor(user), at: new Date() }],
      revisions: [
        {
          version: 1,
          title: sanitizedData.title,
          excerpt: sanitizedData.excerpt || sanitizedData.subtitle || '',
          content: sanitizedData.content,
          changedBy: serialiseActor(user),
          changeSummary: 'Initial creation',
          createdAt: new Date(),
        },
      ],
    });
    return post;
  }

  async update(postId, data, user) {
    const post = await Post.findById(postId);
    if (!post) throw new Error('Content not found');
    if (!canEditPost(post, user)) throw new Error('You cannot edit this content');
    if (data.slug && data.slug !== post.slug && (await Post.exists({ slug: data.slug, _id: { $ne: postId } }))) {
      throw new Error('A post with this slug already exists');
    }

    const sanitizedData = await sanitizeTaxonomyFields(data);

    const isEditor = EDITORIAL_ROLES.has(user?.role);
    const blocked = ['status', 'publishedAt', 'scheduledAt', 'changeSummary', 'isAutosave'];

    for (const [key, value] of Object.entries(sanitizedData)) {
      if (!blocked.includes(key)) post[key] = value;
    }

    // Handle status transitions if editor requested
    if (sanitizedData.status && isEditor) {
      if (['published', 'updated'].includes(sanitizedData.status)) {
        const validation = validatePublicationIntegrity(post);
        if (!validation.isValid) {
          throw new Error(`Cannot publish article due to integrity issues: ${validation.issues.join('; ')}`);
        }
        post.status = 'published';
        post.publishedAt = post.publishedAt || sanitizedData.publishedAt || new Date();
      } else if (sanitizedData.status === 'scheduled') {
        const validation = validatePublicationIntegrity(post);
        if (!validation.isValid) {
          throw new Error(`Cannot schedule article due to integrity issues: ${validation.issues.join('; ')}`);
        }
        post.status = 'scheduled';
        post.scheduledAt = sanitizedData.scheduledAt ? new Date(sanitizedData.scheduledAt) : post.scheduledAt;
      } else {
        post.status = sanitizedData.status;
      }
    }

    // Only record a formal version milestone if NOT a background autosave
    if (!sanitizedData.isAutosave) {
      const revision = {
        version: (post.revisions?.length || 0) + 1,
        title: post.title,
        excerpt: post.excerpt || post.subtitle || '',
        content: post.content,
        changedBy: serialiseActor(user),
        changeSummary: sanitizedData.changeSummary || (sanitizedData.status === 'published' ? 'Published story' : 'Content updated'),
        createdAt: new Date(),
      };

      if (post.revisions.length >= 50) {
        post.revisions.shift();
      }
      post.revisions.push(revision);
      post.editorialHistory.push({
        action: sanitizedData.status === 'published' ? 'published' : 'edited',
        by: serialiseActor(user),
        summary: sanitizedData.changeSummary || '',
        at: new Date(),
      });
    }

    await post.save();
    return post;
  }

  async transition(postId, nextStatus, user, note = '', scheduledAt) {
    const post = await Post.findById(postId);
    if (!post) throw new Error('Content not found');
    if (!transitions[post.status]?.includes(nextStatus)) {
      throw new Error(`Cannot move ${post.status} content to ${nextStatus}`);
    }
    if (!canEditPost(post, user)) throw new Error('You cannot change this content');
    const requiresEditor = ['approved', 'scheduled', 'published', 'archived'].includes(nextStatus);
    if (requiresEditor && !EDITORIAL_ROLES.has(user?.role)) {
      throw new Error('An editor is required for this editorial action');
    }
    if (nextStatus === 'scheduled' && (!scheduledAt || new Date(scheduledAt) <= new Date())) {
      throw new Error('Scheduled publishing requires a future date and time');
    }

    if (['published', 'updated', 'scheduled'].includes(nextStatus)) {
      const validation = validatePublicationIntegrity(post);
      if (!validation.isValid) {
        throw new Error(`Cannot publish article due to integrity issues: ${validation.issues.join('; ')}`);
      }
    }

    post.status = nextStatus === 'updated' ? 'published' : nextStatus;
    post.editorialNotes = note || post.editorialNotes;
    if (nextStatus === 'in_review') post.submittedAt = new Date();
    if (nextStatus === 'approved') post.approvedAt = new Date();
    if (nextStatus === 'scheduled') post.scheduledAt = new Date(scheduledAt);
    if (nextStatus === 'published') {
      post.publishedAt = new Date();
      post.scheduledAt = undefined;
    }
    if (nextStatus === 'archived') post.archivedAt = new Date();

    post.editorialHistory.push({ action: nextStatus, by: serialiseActor(user), note, at: new Date() });
    await post.save();
    return post;
  }

  async publishDueContent(now = new Date()) {
    return Post.updateMany(
      { status: 'scheduled', scheduledAt: { $lte: now } },
      { $set: { status: 'published', publishedAt: now }, $unset: { scheduledAt: '' } }
    );
  }
}

export const editorialService = new EditorialService();
