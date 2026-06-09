import PrivacyClient from '@/components/pages/PrivacyClient';

export const metadata = {
  title: 'Privacy Policy | TeachyBlogs - Web Dev & Design Creator',
  description: 'Read the Privacy Policy for TechyBlogs. Learn how we collect, secure, and handle visitor data and cookie storage.',
  keywords: 'Privacy Policy, TechyBlogs privacy, cookies storage, user data policy, web blog safety',
  alternates: {
    canonical: 'https://teachyblogs.com/privacy',
  },
  openGraph: {
    title: 'Privacy Policy | TeachyBlogs',
    description: 'Read the Privacy Policy for TechyBlogs. Learn how we collect, secure, and handle visitor data and cookie storage.',
    url: 'https://teachyblogs.com/privacy',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Privacy Policy | TeachyBlogs',
    description: 'TechyBlogs Privacy Policy and data usage terms.',
  }
};

export default function PrivacyPage() {
  const privacySchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Privacy Policy - TeachyBlogs",
    "description": "TechyBlogs Privacy Policy. Read how we protect and manage your personal data.",
    "url": "https://teachyblogs.com/privacy"
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(privacySchema) }}
      />
      <PrivacyClient />
    </>
  );
}
