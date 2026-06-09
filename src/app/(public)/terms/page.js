import TermsClient from '@/components/pages/TermsClient';

export const metadata = {
  title: 'Terms of Service | TeachyBlogs - Web Dev & Design Creator',
  description: 'Read the Terms of Service for TechyBlogs. Learn about intellectual property permissions, user responsibilities, and legal disclaimers.',
  keywords: 'Terms of Service, TechyBlogs terms, code usage license, developer blog rules',
  alternates: {
    canonical: 'https://teachyblogs.com/terms',
  },
  openGraph: {
    title: 'Terms of Service | TeachyBlogs',
    description: 'Read the Terms of Service for TechyBlogs. Learn about intellectual property permissions, user responsibilities, and legal disclaimers.',
    url: 'https://teachyblogs.com/terms',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Terms of Service | TeachyBlogs',
    description: 'TechyBlogs Terms of Service agreement and licensing regulations.',
  }
};

export default function TermsPage() {
  const termsSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Terms of Service - TechyBlogs",
    "description": "TechyBlogs Terms of Service. Understand rights, permissions, and developer responsibilities.",
    "url": "https://teachyblogs.com/terms"
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(termsSchema) }}
      />
      <TermsClient />
    </>
  );
}
