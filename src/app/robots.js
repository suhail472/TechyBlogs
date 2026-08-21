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
      'https://teachyblogs.com/sitemap.xml',
      'https://teachyblogs.com/news-sitemap.xml',
    ],
  };
}
