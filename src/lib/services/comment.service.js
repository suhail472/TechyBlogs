import Comment from '../models/comment.model.js';

class CommentService {
  async createComment(commentData) {
    const { slug, name, text } = commentData;
    if (!slug || !name || !text) throw new Error('Missing required comment fields');
    
    return await Comment.create({
      slug,
      name,
      text,
      status: 'pending',
    });
  }

  async getCommentsBySlug(slug, filterApproved = true) {
    const query = { slug };
    if (filterApproved) {
      query.status = 'approved';
    }
    return await Comment.find(query).sort({ timestamp: -1 }).lean();
  }

  async getAllComments(filters = {}) {
    const { status, slug, page = 1, limit = 20 } = filters;
    const query = {};
    if (status) query.status = status;
    if (slug) query.slug = slug;

    const skip = (page - 1) * limit;

    const [comments, total] = await Promise.all([
      Comment.find(query).sort({ timestamp: -1 }).skip(skip).limit(parseInt(limit)).lean(),
      Comment.countDocuments(query),
    ]);

    return {
      comments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async updateCommentStatus(commentId, status) {
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      throw new Error('Invalid status value');
    }
    const comment = await Comment.findById(commentId);
    if (!comment) throw new Error('Comment not found');
    
    comment.status = status;
    await comment.save();
    return comment;
  }

  async deleteComment(commentId) {
    const comment = await Comment.findById(commentId);
    if (!comment) throw new Error('Comment not found');
    await comment.deleteOne();
    return { message: 'Comment deleted successfully' };
  }
}

const commentService = new CommentService();
export default commentService;
