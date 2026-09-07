import connectToDatabase from '@/lib/db';
import Post, { getPublicPostFilter } from '@/lib/models/post.model';
import BlogsClient from '@/components/pages/BlogsClient';
import { DEFAULT_STORIES } from '@/data/defaultStories';

export const metadata = {
  title: 'All Stories & Archives | TechyBlogs',
  description: 'Explore comprehensive coverage across Technology, News, Education, Travel, and Analysis on TechyBlogs.',
  keywords: 'Web Development Blog, News, Education, Tech Reviews, Kashmir Guides, Coding Tutorials',
  alternates: {
    canonical: 'https://techyblogs.com/blogs',
  },
  openGraph: {
    title: 'All Stories & Archives | TechyBlogs',
    description: 'Explore comprehensive coverage across Technology, News, Education, Travel, and Analysis on TechyBlogs.',
    url: 'https://techyblogs.com/blogs',
    type: 'website',
  },
};

export default async function BlogsPage(props) {
  const searchParams = await props.searchParams;
  const category = searchParams?.category || 'All';
  
  let serializedPosts = [];

  try {
    await connectToDatabase();
    const posts = await Post.find(getPublicPostFilter())
      .sort({ publishedAt: -1 })
      .populate('primarySection', 'name slug')
      .populate('editions', 'name slug')
      .populate('primaryAuthor', 'name slug avatar')
      .lean();
    
    serializedPosts = JSON.parse(JSON.stringify(posts));
  } catch (err) {
    console.warn('Database query during blogs archive failed:', err.message);
  }

  // Fallback to rich default stories if database is empty or offline
  if (!serializedPosts || serializedPosts.length === 0) {
    serializedPosts = DEFAULT_STORIES;
  }
  
  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "Story Archives - TechyBlogs",
    "description": "Explore all essays, tutorials, and regional insights published on TechyBlogs.",
    "url": "https://techyblogs.com/blogs"
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
