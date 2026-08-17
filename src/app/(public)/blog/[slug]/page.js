import connectToDatabase from '@/lib/db';
import Post from '@/lib/models/post.model';
import PostClient from '@/components/pages/PostClient';
import { notFound } from 'next/navigation';
import { DEFAULT_STORIES } from '@/data/defaultStories';

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;

  let blog = null;
  try {
    await connectToDatabase();
    blog = await Post.findOne({ slug, status: 'published' })
      .populate('primaryTopic', 'name slug')
      .populate('primaryRegion', 'name slug')
      .lean();
  } catch (err) {
    // ignore
  }

  if (!blog) {
    blog = DEFAULT_STORIES.find((s) => s.slug === slug);
  }

  if (!blog) {
    return {
      title: 'Story Not Found | TeachyBlogs',
      description: 'The requested story could not be found.',
    };
  }

  return {
    title: `${blog.title} | TeachyBlogs`,
    description: blog.metaDescription || blog.seo?.description || blog.excerpt,
    keywords: blog.keywords || (blog.tags ? blog.tags.join(', ') : 'digital publishing, journalism'),
    alternates: {
      canonical: `https://teachyblogs.com/blog/${slug}`,
    },
    openGraph: {
      title: blog.seo?.socialTitle || blog.seo?.title || blog.title,
      description: blog.seo?.socialDescription || blog.seo?.description || blog.excerpt,
      url: `https://teachyblogs.com/blog/${slug}`,
      type: 'article',
      publishedTime: blog.publishedAt || blog.createdAt,
      modifiedTime: blog.updatedAt || blog.publishedAt || blog.createdAt,
      authors: [blog.author || 'Suheel Hilal'],
      images: [
        {
          url: blog.seo?.socialImage || blog.image || 'https://teachyblogs.com/favicon.ico',
          alt: blog.title,
          width: 1200,
          height: 630,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: blog.seo?.socialTitle || blog.title,
      description: blog.seo?.socialDescription || blog.excerpt,
      images: [blog.seo?.socialImage || blog.image || 'https://teachyblogs.com/favicon.ico'],
    },
  };
}

export default async function SingleBlogPage({ params }) {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;

  let blog = null;
  let allRelated = [];

  try {
    await connectToDatabase();
    blog = await Post.findOne({ slug, status: 'published' })
      .populate('primaryAuthor', 'name slug avatar bio role expertise')
      .populate('primaryTopic', 'name slug ancestors')
      .populate('primaryRegion', 'name slug isHub type ancestors')
      .populate('topics', 'name slug')
      .populate('regions', 'name slug')
      .populate('entities', 'name slug type')
      .populate('series', 'name slug title')
      .populate('coverage', 'name slug title')
      .lean();

    if (blog) {
      const query = {
        status: 'published',
        slug: { $ne: slug },
      };

      if (blog.primaryTopic) {
        query.$or = [{ primaryTopic: blog.primaryTopic._id }, { topics: blog.primaryTopic._id }];
      }

      const relatedPosts = await Post.find(query)
        .populate('primaryTopic', 'name slug')
        .populate('primaryRegion', 'name slug')
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
          .populate('primaryTopic', 'name slug')
          .populate('primaryRegion', 'name slug')
          .sort({ publishedAt: -1 })
          .limit(3 - allRelated.length)
          .lean();
        allRelated = [...allRelated, ...extraPosts];
      }
    }
  } catch (err) {
    console.warn('Failed to load article from DB:', err.message);
  }

  // Fallback to default stories if DB is empty or disconnected
  if (!blog) {
    blog = DEFAULT_STORIES.find((s) => s.slug === slug);
    if (blog) {
      allRelated = DEFAULT_STORIES.filter((s) => s.slug !== slug).slice(0, 3);
    }
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
  let schemaType = 'Article';
  if (blog.contentType === 'news') schemaType = 'NewsArticle';
  else if (blog.contentType === 'tutorial') schemaType = 'TechArticle';

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': schemaType,
    headline: blog.title,
    description: blog.excerpt,
    image: blog.image,
    datePublished: blog.publishedAt || blog.createdAt,
    dateModified: blog.updatedAt || blog.publishedAt || blog.createdAt,
    inLanguage: blog.language || 'en',
    author: {
      '@type': 'Person',
      name: blog.author || 'Suheel Hilal',
      url: `https://teachyblogs.com/author/${blog.primaryAuthor?.slug || 'suheel-hilal'}`,
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

  // Breadcrumb List Schema
  const breadcrumbItems = [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://teachyblogs.com' },
  ];
  if (blog.primaryTopic) {
    breadcrumbItems.push({
      '@type': 'ListItem',
      position: 2,
      name: blog.primaryTopic.name,
      item: `https://teachyblogs.com/topic/${blog.primaryTopic.slug}`,
    });
  }
  breadcrumbItems.push({
    '@type': 'ListItem',
    position: breadcrumbItems.length + 1,
    name: blog.title,
    item: `https://teachyblogs.com/blog/${slug}`,
  });

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbItems,
  };

  let faqSchema = null;
  const validFaqs = (blog.faqs || []).filter(
    (f) => f && typeof f.question === 'string' && f.question.trim().length > 5 && typeof f.answer === 'string' && f.answer.trim().length > 5
  );
  if (validFaqs.length > 0) {
    faqSchema = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: validFaqs.map((faq) => ({
        '@type': 'Question',
        name: faq.question.trim(),
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer.trim(),
        },
      })),
    };
  }

  return (
    <>
      {/* Google SEO JSON-LD Structured Data Scripts */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
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
