import CookiesClient from '@/components/pages/CookiesClient';

export const metadata = {
  title: 'Cookies Policy | TechyBlogs - Web Dev & Design Creator',
  description: 'Read the Cookies and LocalStorage Policy for TechyBlogs. Understand how we utilize local storage parameters to persist your visual theme.',
  keywords: 'Cookies Policy, LocalStorage settings, TechyBlogs theme state, visual preferences data',
  alternates: {
    canonical: 'https://techyblogs.com/cookies',
  },
  openGraph: {
    title: 'Cookies Policy | TechyBlogs',
    description: 'Read the Cookies and LocalStorage Policy for TechyBlogs. Understand how we utilize local storage parameters to persist your visual theme.',
    url: 'https://techyblogs.com/cookies',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Cookies Policy | TechyBlogs',
    description: 'TechyBlogs Cookies and LocalStorage usage description.',
  }
};

export default function CookiesPage() {
  const cookiesSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Cookies Policy - TechyBlogs",
    "description": "TechyBlogs Cookies and LocalStorage Policy. Read how preferences are stored in the client browser.",
    "url": "https://techyblogs.com/cookies"
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(cookiesSchema) }}
      />
      <CookiesClient />
    </>
  );
}
