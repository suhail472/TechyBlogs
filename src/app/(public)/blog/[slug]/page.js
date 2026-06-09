import connectToDatabase from '@/lib/db';
import Post from '@/lib/models/post.model';
import PostClient from '@/components/pages/PostClient';
import { notFound } from 'next/navigation';

// Dynamic SEO metadata generation
export async function generateMetadata({ params }) {
  await connectToDatabase();
  const resolvedParams = await params;
  const slug = resolvedParams.slug;
  const blog = await Post.findOne({ slug, status: 'published' }).lean();

  if (!blog) {
    return {
      title: 'Article Not Found | TeachyBlogs',
      description: 'The requested web development article could not be found.',
    };
  }

  return {
    title: `${blog.title} | TeachyBlogs`,
    description: blog.metaDescription || blog.excerpt,
    keywords: blog.keywords || (blog.tags ? blog.tags.join(', ') : 'web development, coding tutorial'),
    alternates: {
      canonical: `https://teachyblogs.com/blog/${slug}`,
    },
    openGraph: {
      title: `${blog.title} | TeachyBlogs`,
      description: blog.metaDescription || blog.excerpt,
      url: `https://teachyblogs.com/blog/${slug}`,
      type: 'article',
      publishedTime: blog.publishedAt || blog.createdAt,
      modifiedTime: blog.updatedAt || blog.publishedAt || blog.createdAt,
      authors: [blog.author || 'Suheel Hilal'],
      images: [
        {
          url: `https://teachyblogs.com/blog/${slug}/opengraph-image`,
          alt: blog.title,
          width: 1200,
          height: 630,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: blog.title,
      description: blog.metaDescription || blog.excerpt,
      images: [`https://teachyblogs.com/blog/${slug}/opengraph-image`],
    },
  };
}

export default async function SingleBlogPage({ params }) {
  await connectToDatabase();
  const resolvedParams = await params;
  const slug = resolvedParams.slug;
  
  const blog = await Post.findOne({ slug, status: 'published' }).lean();

  if (!blog) {
    notFound();
  }

  // Fetch related posts (same categories, excluding current, limit 4)
  const relatedPosts = await Post.find({
    status: 'published',
    slug: { $ne: slug },
    categories: { $in: blog.categories || [] },
  })
    .sort({ publishedAt: -1 })
    .limit(4)
    .lean();

  // If not enough related by category, fill with latest posts
  let allRelated = relatedPosts;
  if (allRelated.length < 3) {
    const excludeSlugs = [slug, ...allRelated.map(p => p.slug)];
    const extraPosts = await Post.find({
      status: 'published',
      slug: { $nin: excludeSlugs },
    })
      .sort({ publishedAt: -1 })
      .limit(3 - allRelated.length)
      .lean();
    allRelated = [...allRelated, ...extraPosts];
  }

  // Serialize Document for client rendering prop transmission
  const cleanBlog = JSON.parse(JSON.stringify(blog));
  const serializedBlog = {
    ...cleanBlog,
    metaDescription: cleanBlog.metaDescription || '',
    keywords: cleanBlog.keywords || '',
  };

  const serializedRelated = JSON.parse(JSON.stringify(allRelated));

  // Construct JSON-LD Structured Data Schema for Google rich search indexation
  const blogSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": blog.title,
    "description": blog.excerpt,
    "image": blog.image,
    "datePublished": blog.publishedAt || blog.createdAt,
    "dateModified": blog.updatedAt || blog.publishedAt || blog.createdAt,
    "author": {
      "@type": "Person",
      "name": blog.author || "Suheel Hilal",
      "url": "https://www.suhailhilal.in"
    },
    "publisher": {
      "@type": "Organization",
      "name": "TeachyBlogs",
      "logo": {
        "@type": "ImageObject",
        "url": "https://teachyblogs.com/favicon.ico"
      }
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `https://teachyblogs.com/blog/${slug}`
    },
    "keywords": blog.keywords || (blog.tags ? blog.tags.join(', ') : '')
  };

  let faqSchema = null;
  if (blog.faqs && blog.faqs.length > 0) {
    faqSchema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": blog.faqs.map(faq => ({
        "@type": "Question",
        "name": faq.question,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": faq.answer
        }
      }))
    };
  }

  return (
    <>
      {/* Google SEO JSON-LD Structured Data Scripts */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogSchema) }}
      />
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}
      <PostClient blog={serializedBlog} relatedPosts={serializedRelated} />
    </>
  );
}
