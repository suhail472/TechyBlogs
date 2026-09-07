import ContactClient from '@/components/pages/ContactClient';

export const metadata = {
  title: 'Contact Suheel Hilal | TechyBlogs - Web Design & Coding Support',
  description: 'Reach out to Suheel Hilal at TechyBlogs. Get in touch for professional web development collaborations, consulting inquiries, or coding questions.',
  keywords: 'Contact, Suheel Hilal, TechyBlogs contact, web design, frontend consulting, coding help',
  alternates: {
    canonical: 'https://techyblogs.com/contact',
  },
  openGraph: {
    title: 'Contact Suheel Hilal | TechyBlogs - Web Design & Coding Support',
    description: 'Reach out to Suheel Hilal at TechyBlogs. Get in touch for professional web development collaborations, consulting inquiries, or coding questions.',
    url: 'https://techyblogs.com/contact',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Contact Suheel Hilal | TechyBlogs',
    description: 'Reach out for professional frontend collaborations and custom web designs.',
  }
};

export default function ContactPage() {
  const contactSchema = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    "name": "Contact Suheel Hilal - TechyBlogs",
    "description": "Get in touch with Suheel Hilal for collaborations, consultations, or queries.",
    "url": "https://techyblogs.com/contact"
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(contactSchema) }}
      />
      <ContactClient />
    </>
  );
}
