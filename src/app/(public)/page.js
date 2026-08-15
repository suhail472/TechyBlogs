import connectToDatabase from '@/lib/db';
import Post from '@/lib/models/post.model';
import EditorialHome from '@/components/pages/EditorialHome';

export const metadata = {
  title: 'TeachyBlogs - Modern Digital Publishing Platform & Journal',
  description: 'Independent reporting, technical guides, product reviews, and regional news across Technology, Education, Kashmir, and Culture by Suheel Hilal.',
  keywords: 'Web Development, Coding Tutorials, React, Next.js, Kashmir News, Technology, Reviews, Education, Software Engineer, Suheel Hilal',
  alternates: {
    canonical: 'https://teachyblogs.com',
  },
  openGraph: {
    title: 'TeachyBlogs - Modern Digital Publishing Platform',
    description: 'Independent reporting, technical guides, product reviews, and regional news across Technology, Education, Kashmir, and Culture.',
    url: 'https://teachyblogs.com',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TeachyBlogs - Digital Publishing Platform',
    description: 'Modern journalism and digital publishing platform.',
  }
};

export default async function HomePage() {
  let serializedPosts = [];

  try {
    await connectToDatabase();
    
    // Fetch published articles
    const posts = await Post.find({ status: 'published' })
      .sort({ publishedAt: -1 })
      .limit(12)
      .populate('primarySection', 'name slug')
      .populate('editions', 'name slug')
      .populate('primaryAuthor', 'name slug avatar')
      .lean();
    
    serializedPosts = JSON.parse(JSON.stringify(posts));
  } catch (err) {
    console.warn('Database query during page render failed, using fallback:', err.message);
  }

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "TeachyBlogs",
    "url": "https://teachyblogs.com",
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
