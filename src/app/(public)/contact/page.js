import ContactClient from '@/components/pages/ContactClient';

export const metadata = {
  title: 'Contact Suheel Hilal | TeachyBlogs - Web Design & Coding Support',
  description: 'Reach out to Suheel Hilal at TeachyBlogs. Get in touch for professional web development collaborations, consulting inquiries, or coding questions.',
  keywords: 'Contact, Suheel Hilal, TeachyBlogs contact, web design, frontend consulting, coding help',
  alternates: {
    canonical: 'https://teachyblogs.com/contact',
  },
  openGraph: {
    title: 'Contact Suheel Hilal | TeachyBlogs - Web Design & Coding Support',
    description: 'Reach out to Suheel Hilal at TeachyBlogs. Get in touch for professional web development collaborations, consulting inquiries, or coding questions.',
    url: 'https://teachyblogs.com/contact',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Contact Suheel Hilal | TeachyBlogs',
    description: 'Reach out for professional frontend collaborations and custom web designs.',
  }
};

export default function ContactPage() {
  const contactSchema = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    "name": "Contact Suheel Hilal - TeachyBlogs",
    "description": "Get in touch with Suheel Hilal for collaborations, consultations, or queries.",
    "url": "https://teachyblogs.com/contact"
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
