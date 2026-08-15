import connectToDatabase from '@/lib/db';
import Post from '@/lib/models/post.model';
import BlogsClient from '@/components/pages/BlogsClient';

export const metadata = {
  title: 'All Stories & Archives | TeachyBlogs',
  description: 'Explore comprehensive coverage across Technology, News, Education, Travel, and Analysis on TeachyBlogs.',
  keywords: 'Web Development Blog, News, Education, Tech Reviews, Kashmir Guides, Coding Tutorials',
  alternates: {
    canonical: 'https://teachyblogs.com/blogs',
  },
  openGraph: {
    title: 'All Stories & Archives | TeachyBlogs',
    description: 'Explore comprehensive coverage across Technology, News, Education, Travel, and Analysis on TeachyBlogs.',
    url: 'https://teachyblogs.com/blogs',
    type: 'website',
  },
};

export default async function BlogsPage(props) {
  const searchParams = await props.searchParams;
  const category = searchParams?.category || 'All';
  
  let serializedPosts = [];

  try {
    await connectToDatabase();
    const posts = await Post.find({ status: 'published' })
      .sort({ publishedAt: -1 })
      .populate('primarySection', 'name slug')
      .populate('editions', 'name slug')
      .populate('primaryAuthor', 'name slug avatar')
      .lean();
    
    serializedPosts = JSON.parse(JSON.stringify(posts));
  } catch (err) {
    console.warn('Database query during blogs archive failed:', err.message);
  }
  
  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "Story Archives - TeachyBlogs",
    "description": "Explore all essays, tutorials, and regional insights published on TeachyBlogs.",
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
