import CookiesClient from '@/components/pages/CookiesClient';

export const metadata = {
  title: 'Cookies Policy | TeachyBlogs - Web Dev & Design Creator',
  description: 'Read the Cookies and LocalStorage Policy for TechyBlogs. Understand how we utilize local storage parameters to persist your visual theme.',
  keywords: 'Cookies Policy, LocalStorage settings, TechyBlogs theme state, visual preferences data',
  alternates: {
    canonical: 'https://teachyblogs.com/cookies',
  },
  openGraph: {
    title: 'Cookies Policy | TeachyBlogs',
    description: 'Read the Cookies and LocalStorage Policy for TechyBlogs. Understand how we utilize local storage parameters to persist your visual theme.',
    url: 'https://teachyblogs.com/cookies',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Cookies Policy | TeachyBlogs',
    description: 'TechyBlogs Cookies and LocalStorage usage description.',
  }
};

export default function CookiesPage() {
  const cookiesSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Cookies Policy - TechyBlogs",
    "description": "TechyBlogs Cookies and LocalStorage Policy. Read how preferences are stored in the client browser.",
    "url": "https://teachyblogs.com/cookies"
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
