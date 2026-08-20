import connectToDatabase from '@/lib/db';
import Post, { getPublicPostFilter } from '@/lib/models/post.model';
import '@/lib/models/taxonomy.model';
import '@/lib/models/admin.model';
import PostClient from '@/components/pages/PostClient';
import { notFound } from 'next/navigation';

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;

  let blog = null;
  try {
    await connectToDatabase();
    blog = await Post.findOne(getPublicPostFilter({ slug }))
      .populate('primaryTopic', 'name slug')
      .populate('primaryRegion', 'name slug')
      .lean();
  } catch (err) {
    // ignore
  }

  if (!blog) {
    return {
      title: 'Story Not Found | TeachyBlogs',
      description: 'The requested story could not be found.',
    };
  }

  const canonical = blog.seo?.canonicalUrl || `https://teachyblogs.com/blog/${slug}`;
  const keywordsList = Array.isArray(blog.seo?.keywords) && blog.seo.keywords.length > 0
    ? blog.seo.keywords.join(', ')
    : (blog.keywords || (blog.tags ? blog.tags.join(', ') : 'digital publishing, journalism'));

  const metaTitle = blog.seo?.title ? `${blog.seo.title} | TeachyBlogs` : `${blog.title} | TeachyBlogs`;
  const metaDesc = blog.seo?.description || blog.metaDescription || blog.excerpt || blog.subtitle || '';

  const ogTitle = blog.seo?.socialTitle || blog.seo?.title || blog.title;
  const ogDesc = blog.seo?.socialDescription || blog.seo?.description || blog.excerpt || blog.subtitle || '';
  const ogImage = blog.seo?.socialImage || blog.image || 'https://teachyblogs.com/favicon.ico';

  const twitterTitle = blog.seo?.twitterTitle || blog.seo?.socialTitle || blog.title;
  const twitterDesc = blog.seo?.twitterDescription || blog.seo?.socialDescription || blog.excerpt || '';
  const twitterImage = blog.seo?.twitterImage || blog.seo?.socialImage || blog.image || 'https://teachyblogs.com/favicon.ico';

  const robotsIndex = blog.seo?.robots?.index !== false && blog.seo?.indexable !== false;
  const robotsFollow = blog.seo?.robots?.follow !== false;

  return {
    title: metaTitle,
    description: metaDesc,
    keywords: keywordsList,
    robots: {
      index: robotsIndex,
      follow: robotsFollow,
      googleBot: {
        index: robotsIndex,
        follow: robotsFollow,
      },
    },
    alternates: {
      canonical,
    },
    openGraph: {
      title: ogTitle,
      description: ogDesc,
      url: `https://teachyblogs.com/blog/${slug}`,
      type: 'article',
      publishedTime: blog.publishedAt || blog.createdAt,
      modifiedTime: blog.updatedAt || blog.publishedAt || blog.createdAt,
      authors: [blog.author || 'Suheel Hilal'],
      images: [
        {
          url: ogImage,
          alt: blog.title,
          width: 1200,
          height: 630,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: twitterTitle,
      description: twitterDesc,
      images: [twitterImage],
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
    blog = await Post.findOne(getPublicPostFilter({ slug }))
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
      const relatedExtra = { slug: { $ne: slug } };

      if (blog.primaryTopic) {
        relatedExtra.$or = [{ primaryTopic: blog.primaryTopic._id }, { topics: blog.primaryTopic._id }];
      }

      const query = getPublicPostFilter(relatedExtra);

      const relatedPosts = await Post.find(query)
        .populate('primaryTopic', 'name slug')
        .populate('primaryRegion', 'name slug')
        .sort({ publishedAt: -1 })
        .limit(4)
        .lean();

      allRelated = relatedPosts;
      if (allRelated.length < 3) {
        const excludeSlugs = [slug, ...allRelated.map((p) => p.slug)];
        const extraPosts = await Post.find(
          getPublicPostFilter({
            slug: { $nin: excludeSlugs },
          })
        )
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
