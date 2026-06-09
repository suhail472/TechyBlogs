import connectToDatabase from '@/lib/db';
import Post from '@/lib/models/post.model';
import TagsClient from '@/components/pages/TagsClient';

export const metadata = {
  title: 'Tags | TeachyBlogs - Browse Articles by Topic',
  description: 'Explore all article tags on TeachyBlogs. Browse web development, React, CSS, AI, and more topics with article counts.',
  alternates: {
    canonical: 'https://teachyblogs.com/tags',
  },
  openGraph: {
    title: 'Tags | TeachyBlogs - Browse Articles by Topic',
    description: 'Explore all article tags and categories on TeachyBlogs.',
    url: 'https://teachyblogs.com/tags',
    type: 'website',
  },
};

export default async function TagsPage() {
  await connectToDatabase();

  const posts = await Post.find({ status: 'published' })
    .select('tags categories')
    .lean();

  // Aggregate tags with counts
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

  const tags = Object.entries(tagMap)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  const categories = Object.entries(categoryMap)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  return <TagsClient tags={tags} categories={categories} />;
}
