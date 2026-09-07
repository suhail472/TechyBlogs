import AboutClient from '@/components/pages/AboutClient';

export const metadata = {
  title: 'About Suheel Hilal | TechyBlogs - Web Development & Design Creator',
  description: 'Suheel Hilal is a professional full-stack software engineer and frontend designer. Read about his tech stack, coding insights, and check his portfolio at www.suhailhilal.in.',
  keywords: 'Suheel Hilal, Software Engineer, Frontend Developer, React Specialist, Next.js, Web Design, TechyBlogs Creator, Portfolio',
  alternates: {
    canonical: 'https://techyblogs.com/about',
  },
  openGraph: {
    title: 'About Suheel Hilal | TechyBlogs - Web Dev & Design Creator',
    description: 'Suheel Hilal is a professional full-stack software engineer and frontend designer. Read about his tech stack, coding insights, and check his portfolio at www.suhailhilal.in.',
    url: 'https://techyblogs.com/about',
    type: 'profile',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About Suheel Hilal | TechyBlogs',
    description: 'Professional full-stack software engineer & creator of TechyBlogs.',
  }
};

export default function AboutPage() {
  const profileSchema = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    "mainEntity": {
      "@type": "Person",
      "name": "Suheel Hilal",
      "jobTitle": "Software Engineer & Frontend Designer",
      "url": "https://www.suhailhilal.in",
      "sameAs": [
        "https://github.com/suheelhilal",
        "https://linkedin.com/in/suheelhilal"
      ]
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(profileSchema) }}
      />
      <AboutClient />
    </>
  );
}
