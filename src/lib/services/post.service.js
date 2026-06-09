import Post from '../models/post.model.js';

class PostService {
  async createPost(postData) {
    const { title, slug, excerpt, content, image, tags, categories, author } = postData;
    const existingPost = await Post.findOne({ slug });
    if (existingPost) throw new Error('A post with this slug already exists');

    return await Post.create({
      title,
      slug,
      excerpt,
      content,
      image,
      tags: tags || [],
      categories,
      author: author || 'Suheel Hilal',
      status: 'published',
    });
  }

  async getAllPosts(filters = {}) {
    const {
      status = 'published',
      category,
      tag,
      page = 1,
      limit = 10,
      sortBy = 'publishedAt',
      sortOrder = 'desc',
    } = filters;

    const query = { status };
    if (category) query.categories = category;
    if (tag) query.tags = tag;

    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const [posts, total] = await Promise.all([
      Post.find(query).sort(sort).skip(skip).limit(parseInt(limit)).lean(),
      Post.countDocuments(query),
    ]);

    return {
      posts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getPostBySlug(slug) {
    const post = await Post.findOne({ slug, status: 'published' });
    if (!post) throw new Error('Post not found');
    post.views += 1;
    await post.save();
    return post;
  }

  async getPostById(postId) {
    const post = await Post.findById(postId);
    if (!post) throw new Error('Post not found');
    return post;
  }

  async updatePost(postId, updateData) {
    const post = await Post.findById(postId);
    if (!post) throw new Error('Post not found');
    if (updateData.slug && updateData.slug !== post.slug) {
      const existingPost = await Post.findOne({ slug: updateData.slug });
      if (existingPost) throw new Error('A post with this slug already exists');
    }
    Object.assign(post, updateData);
    await post.save();
    return post;
  }

  async deletePost(postId) {
    const post = await Post.findById(postId);
    if (!post) throw new Error('Post not found');
    await post.deleteOne();
    return { message: 'Post deleted successfully' };
  }

  async getPostsByCategory(category, page = 1, limit = 10) {
    return this.getAllPosts({ category, page, limit });
  }

  async getPostsByTag(tag, page = 1, limit = 10) {
    return this.getAllPosts({ tag, page, limit });
  }

  async searchPosts(searchTerm, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const query = {
      status: 'published',
      $or: [
        { title: { $regex: searchTerm, $options: 'i' } },
        { excerpt: { $regex: searchTerm, $options: 'i' } },
        { content: { $regex: searchTerm, $options: 'i' } },
        { tags: { $regex: searchTerm, $options: 'i' } },
      ],
    };

    const [posts, total] = await Promise.all([
      Post.find(query)
        .sort({ publishedAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Post.countDocuments(query),
    ]);

    return {
      posts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }
}

const postService = new PostService();
export default postService;