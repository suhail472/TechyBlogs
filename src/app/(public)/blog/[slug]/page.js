import connectToDatabase from '@/lib/db';
import Post from '@/lib/models/post.model';
import PostClient from '@/components/pages/PostClient';
import { notFound } from 'next/navigation';

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;

  try {
    await connectToDatabase();
    const blog = await Post.findOne({ slug, status: 'published' }).lean();

    if (!blog) {
      return {
        title: 'Story Not Found | TeachyBlogs',
        description: 'The requested story could not be found.',
      };
    }

    return {
      title: `${blog.title} | TeachyBlogs`,
      description: blog.metaDescription || blog.excerpt,
      keywords: blog.keywords || (blog.tags ? blog.tags.join(', ') : 'digital publishing, journalism'),
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
            url: blog.image || 'https://teachyblogs.com/favicon.ico',
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
        images: [blog.image || 'https://teachyblogs.com/favicon.ico'],
      },
    };
  } catch (err) {
    return {
      title: 'Story | TeachyBlogs',
      description: 'TeachyBlogs digital publication.',
    };
  }
}

export default async function SingleBlogPage({ params }) {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;

  let blog = null;
  let allRelated = [];

  try {
    await connectToDatabase();
    blog = await Post.findOne({ slug, status: 'published' })
      .populate('primaryAuthor', 'name slug avatar role')
      .populate('primarySection', 'name slug')
      .populate('editions', 'name slug')
      .lean();

    if (blog) {
      const relatedPosts = await Post.find({
        status: 'published',
        slug: { $ne: slug },
        categories: { $in: blog.categories || [] },
      })
        .sort({ publishedAt: -1 })
        .limit(4)
        .lean();

      allRelated = relatedPosts;
      if (allRelated.length < 3) {
        const excludeSlugs = [slug, ...allRelated.map((p) => p.slug)];
        const extraPosts = await Post.find({
          status: 'published',
          slug: { $nin: excludeSlugs },
        })
          .sort({ publishedAt: -1 })
          .limit(3 - allRelated.length)
          .lean();
        allRelated = [...allRelated, ...extraPosts];
      }
    }
  } catch (err) {
    console.warn('Failed to load article from DB:', err.message);
  }

  if (!blog) {
    notFound();
  }

  const cleanBlog = JSON.parse(JSON.stringify(blog));
  const serializedBlog = {
    ...cleanBlog,
    metaDescription: cleanBlog.metaDescription || '',
    keywords: cleanBlog.keywords || '',
  };

  const serializedRelated = JSON.parse(JSON.stringify(allRelated));

  // Determine structured data schema based on content type
  const isNews = blog.contentType === 'news';
  const schemaType = isNews ? 'NewsArticle' : 'Article';

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': schemaType,
    headline: blog.title,
    description: blog.excerpt,
    image: blog.image,
    datePublished: blog.publishedAt || blog.createdAt,
    dateModified: blog.updatedAt || blog.publishedAt || blog.createdAt,
    author: {
      '@type': 'Person',
      name: blog.author || 'Suheel Hilal',
      url: 'https://teachyblogs.com',
    },
    publisher: {
      '@type': 'Organization',
      name: 'TeachyBlogs',
      logo: {
        '@type': 'ImageObject',
        url: 'https://teachyblogs.com/favicon.ico',
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://teachyblogs.com/blog/${slug}`,
    },
    keywords: blog.keywords || (blog.tags ? blog.tags.join(', ') : ''),
  };

  let faqSchema = null;
  if (blog.faqs && blog.faqs.length > 0) {
    faqSchema = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: blog.faqs.map((faq) => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer,
        },
      })),
    };
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
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
