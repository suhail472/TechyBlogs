import { DEFAULT_STORIES } from './defaultStories.js';

export const blogs = (DEFAULT_STORIES || []).map((s, index) => ({
  id: index + 1,
  _id: s._id,
  slug: s.slug,
  title: s.title,
  subtitle: s.subtitle,
  excerpt: s.excerpt,
  content: s.content,
  image: s.image,
  categories: s.categories || [],
  tags: s.tags || [],
  date: s.publishedAt ? new Date(s.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '',
  author: s.author,
  primaryAuthor: s.primaryAuthor,
  primarySection: s.primarySection,
  editions: s.editions,
  topics: s.topics,
  contentType: s.contentType,
  views: s.views,
  likes: s.likes,
  featured: s.featured,
  breaking: s.breaking,
  faqs: s.faqs,
}));

export default blogs;
