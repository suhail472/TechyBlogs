import connectToDatabase from '@/lib/db';
import Post, { getPublicPostFilter } from '@/lib/models/post.model';
import TagsClient from '@/components/pages/TagsClient';

export const metadata = {
  title: 'Tags & Topics | TechyBlogs - Browse Stories by Keyword',
  description: 'Explore all story tags on TechyBlogs. Browse web development, React, CSS, AI, Kashmir, and more topics.',
  alternates: {
    canonical: 'https://techyblogs.com/tags',
  },
  openGraph: {
    title: 'Tags & Topics | TechyBlogs',
    description: 'Explore all story tags and categories on TechyBlogs.',
    url: 'https://techyblogs.com/tags',
    type: 'website',
  },
};

export default async function TagsPage() {
  let tags = [];
  let categories = [];

  try {
    await connectToDatabase();

    const posts = await Post.find(getPublicPostFilter())
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
    console.warn('Database query on tags page failed:', err.message);
  }

  return (
    <main className="pt-28 pb-20 max-w-7xl mx-auto px-6 md:px-10">
      <TagsClient initialTags={tags} initialCategories={categories} />
    </main>
  );
}
