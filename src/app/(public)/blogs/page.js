import connectToDatabase from '@/lib/db';
import Post from '@/lib/models/post.model';
import BlogsClient from '@/components/pages/BlogsClient';

export const metadata = {
  title: 'Blog Archive | TeachyBlogs - Web Dev Tutorials & Design Patterns',
  description: 'Browse all articles and design guides at TeachyBlogs. Read advanced guides on Next.js, React state management, and Tailwind layouts.',
  keywords: 'Web Development Blog, CSS layout tips, Next.js lessons, developer writing, portfolio articles, coding guides',
  alternates: {
    canonical: 'https://teachyblogs.com/blogs',
  },
  openGraph: {
    title: 'Blog Archive | TeachyBlogs - Web Dev Tutorials & Design Patterns',
    description: 'Browse all articles and design guides at TeachyBlogs. Read advanced guides on Next.js, React state management, and Tailwind layouts.',
    url: 'https://teachyblogs.com/blogs',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Blog Archive | TeachyBlogs',
    description: 'Browse all technical articles from Suheel Hilal.',
  }
};

export default async function BlogsPage(props) {
  const searchParams = await props.searchParams;
  const category = searchParams?.category || 'All';
  
  await connectToDatabase();
  const posts = await Post.find({ status: 'published' }).sort({ publishedAt: -1 }).lean();
  
  // Serialize Mongo _id and Dates to prevent Next.js dynamic routing serialization issues
  const serializedPosts = JSON.parse(JSON.stringify(posts));
  
  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "Blog Archive - TeachyBlogs",
    "description": "Explore all technical essays, tutorials, and web development insights written by Suheel Hilal.",
    "url": "https://teachyblogs.com/blogs"
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
      />
      <BlogsClient initialBlogs={serializedPosts} initialCategory={category} />
    </>
  );
}
