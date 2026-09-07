export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/blog/*',
          '/topic/*',
          '/region/*',
          '/kashmir',
          '/entity/*',
          '/author/*',
          '/section/*',
          '/edition/*',
          '/tags',
          '/blogs',
          '/about',
          '/contact',
        ],
        disallow: [
          '/admin/',
          '/api/',
          '/preferences',
          '/unsubscribe',
          '/saved',
        ],
      },
    ],
    sitemap: [
      'https://techyblogs.com/sitemap.xml',
      'https://techyblogs.com/news-sitemap.xml',
    ],
  };
}
