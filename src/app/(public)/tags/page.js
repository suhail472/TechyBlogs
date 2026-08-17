import connectToDatabase from '@/lib/db';
import Post from '@/lib/models/post.model';
import TagsClient from '@/components/pages/TagsClient';
import { DEFAULT_STORIES } from '@/data/defaultStories';

export const metadata = {
  title: 'Tags & Topics | TeachyBlogs - Browse Stories by Keyword',
  description: 'Explore all story tags on TeachyBlogs. Browse web development, React, CSS, AI, Kashmir, and more topics.',
  alternates: {
    canonical: 'https://teachyblogs.com/tags',
  },
  openGraph: {
    title: 'Tags & Topics | TeachyBlogs',
    description: 'Explore all story tags and categories on TeachyBlogs.',
    url: 'https://teachyblogs.com/tags',
    type: 'website',
  },
};

export default async function TagsPage() {
  let tags = [];
  let categories = [];

  try {
    await connectToDatabase();

    const posts = await Post.find({ status: 'published' })
      .select('tags categories')
      .lean();

    if (posts && posts.length > 0) {
      const tagMap = {};
      const categoryMap = {};

      posts.forEach((post) => {
        (post.tags || []).forEach((tag) => {
          const normalized = tag.trim();
          if (normalized) {
            tagMap[normalized] = (tagMap[normalized] || 0) + 1;
          }
        });
        (post.categories || []).forEach((cat) => {
          const normalized = cat.trim();
          if (normalized) {
            categoryMap[normalized] = (categoryMap[normalized] || 0) + 1;
          }
        });
      });

      tags = Object.entries(tagMap)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);

      categories = Object.entries(categoryMap)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);
    }
  } catch (err) {
    console.warn('Database query on tags page failed, using DEFAULT_STORIES fallback:', err.message);
  }

  // Fallback to DEFAULT_STORIES if DB returned empty
  if (tags.length === 0 && categories.length === 0) {
    const tagMap = {};
    const categoryMap = {};

    DEFAULT_STORIES.forEach((post) => {
      (post.tags || []).forEach((tag) => {
        const normalized = tag.trim();
        if (normalized) {
          tagMap[normalized] = (tagMap[normalized] || 0) + 1;
        }
      });
      (post.categories || []).forEach((cat) => {
        const normalized = cat.trim();
        if (normalized) {
          categoryMap[normalized] = (categoryMap[normalized] || 0) + 1;
        }
      });
    });

    tags = Object.entries(tagMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    categories = Object.entries(categoryMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }

  return <TagsClient tags={tags} categories={categories} />;
}
