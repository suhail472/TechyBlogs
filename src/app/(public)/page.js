import connectToDatabase from '@/lib/db';
import Post, { getPublicPostFilter } from '@/lib/models/post.model';
import '@/lib/models/taxonomy.model';
import '@/lib/models/admin.model';
import EditorialHome from '@/components/pages/EditorialHome';
import { DEFAULT_STORIES } from '@/data/defaultStories';

export const metadata = {
  title: 'TechyBlogs - Modern Digital Publishing Platform & Journal',
  description: 'Independent reporting, technical guides, product reviews, and regional news across Technology, Education, Kashmir, and Culture by Suheel Hilal.',
  keywords: 'Web Development, Coding Tutorials, React, Next.js, Kashmir News, Technology, Reviews, Education, Software Engineer, Suheel Hilal',
  alternates: {
    canonical: 'https://techyblogs.com',
  },
  openGraph: {
    title: 'TechyBlogs - Modern Digital Publishing Platform',
    description: 'Independent reporting, technical guides, product reviews, and regional news across Technology, Education, Kashmir, and Culture.',
    url: 'https://techyblogs.com',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TechyBlogs - Digital Publishing Platform',
    description: 'Modern journalism and digital publishing platform.',
  }
};

export default async function HomePage() {
  let serializedPosts = [];

  try {
    await connectToDatabase();
    
    // Fetch published non-embargoed articles
    const posts = await Post.find(getPublicPostFilter())
      .sort({ publishedAt: -1 })
      .limit(18)
      .populate('primarySection', 'name slug')
      .populate('editions', 'name slug')
      .populate('primaryAuthor', 'name slug avatar')
      .lean();
    
    serializedPosts = JSON.parse(JSON.stringify(posts));
  } catch (err) {
    console.warn('Database query during page render failed, using fallback:', err.message);
  }

  // Fallback to rich default stories if database is empty or offline
  if (!serializedPosts || serializedPosts.length === 0) {
    serializedPosts = DEFAULT_STORIES;
  }

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "TechyBlogs",
    "url": "https://techyblogs.com",
    "description": "Independent reporting, technical guides, product reviews, and regional news across Technology, Education, Kashmir, and Culture.",
    "publisher": {
      "@type": "Person",
      "name": "Suheel Hilal"
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <EditorialHome posts={serializedPosts} />
    </>
  );
}
