import connectToDatabase from '@/lib/db';
import Post from '@/lib/models/post.model';
import HomeClient from '@/components/pages/HomeClient';

export const metadata = {
  title: 'TeachyBlogs - Professional Web Development & Coding Blog',
  description: 'Discover modern web design patterns, tutorials, frameworks, and insights into the future of software engineering. Learn React, Next.js, and CSS layout design.',
  keywords: 'Web Development, Coding Tutorials, React, Next.js, Tailwind CSS, Javascript, Software Engineer, Suheel Hilal',
  alternates: {
    canonical: 'https://teachyblogs.com',
  },
  openGraph: {
    title: 'TeachyBlogs - Professional Web Development & Coding Blog',
    description: 'Discover modern web design patterns, tutorials, frameworks, and insights into the future of software engineering. Learn React, Next.js, and CSS layout design.',
    url: 'https://teachyblogs.com',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TeachyBlogs - Web Dev & Coding Blog',
    description: 'Learn modern web engineering from Suheel Hilal.',
  }
};

export default async function HomePage() {
  await connectToDatabase();
  
  // Fetch published articles
  const posts = await Post.find({ status: 'published' })
    .sort({ publishedAt: -1 })
    .limit(12)
    .lean();
  
  // Serialize Mongo _id and Dates to prevent Next.js dynamic routing serialization issues
  const serializedPosts = JSON.parse(JSON.stringify(posts));

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "TeachyBlogs",
    "url": "https://teachyblogs.com",
    "description": "Discover modern web design patterns, tutorials, frameworks, and insights into the future of software engineering.",
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
      <HomeClient initialBlogs={serializedPosts} />
    </>
  );
}
