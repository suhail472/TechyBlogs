'use client';

import { motion } from 'framer-motion';
import TopLoader from '@/components/shared/TopLoader';

export default function TermsClient() {
  return (
    <div className="pt-40 pb-24 px-6 md:px-12 max-w-4xl mx-auto">
      <TopLoader />
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-10"
      >
        <header className="space-y-4">
          <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2.5 py-1 rounded-md">
            Legal
          </span>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-zinc-900 dark:text-white font-display">
            Terms of Service
          </h1>
          <p className="text-sm font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
            Last Updated: June 8, 2026
          </p>
        </header>

        <article className="prose prose-zinc dark:prose-invert max-w-none space-y-8 text-sm md:text-base leading-relaxed text-zinc-650 dark:text-zinc-400 font-medium">
          <section className="space-y-3">
            <h2 className="text-xl md:text-2xl font-bold text-zinc-900 dark:text-white font-display">
              1. Agreement to Terms
            </h2>
            <p>
              By accessing and browsing TechyBlogs ("Service"), you agree to comply with and be bound by these Terms of Service. If you do not agree to all of these terms, please do not use the website or engage with its features.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl md:text-2xl font-bold text-zinc-900 dark:text-white font-display">
              2. Intellectual Property Rights
            </h2>
            <p>
              Unless otherwise indicated, all blog articles, styling guides, React components, graphics, code snippets, visual designs, and design system tokens on this website are the property of Suheel Hilal and are protected by copyright, database rights, and other intellectual property law regulations.
            </p>
            <p>
              You may read, copy code blocks for your own personal developer education, and reference portions of our essays under "fair use" principles, provided that proper source attribution and clickable hyperlinks back to TechyBlogs are included.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl md:text-2xl font-bold text-zinc-900 dark:text-white font-display">
              3. User Responsibilities & Prohibited Acts
            </h2>
            <p>
              As a user of our Service, you agree that you will not:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                Engage in any automated scraping, data extraction, or spider harvesting of blog content without explicit prior written consent.
              </li>
              <li>
                Attempt to bypass administrative session guards, brute-force the superadmin authentication dashboard endpoints, or insert malicious JavaScript within database inputs.
              </li>
              <li>
                Submit spam messages or invalid email formats inside newsletter inputs or contact contact portals.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl md:text-2xl font-bold text-zinc-900 dark:text-white font-display">
              4. Disclaimer of Liability
            </h2>
            <p>
              TechyBlogs is an educational platform. The code examples, layout designs, system architectures, and framework recommendations are provided on an "as-is" basis without guarantees of completeness or execution safety in your specific environments. We are not liable for database issues, service downtime, configuration errors, or security flaws that occur in your own software following our advice.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl md:text-2xl font-bold text-zinc-900 dark:text-white font-display">
              5. Modification of Service & Contact
            </h2>
            <p>
              We reserve the right to edit, modify, or archive articles, layout assets, and pages at any time without prior warning. For any legal inquiries regarding these terms, copyright licenses, or usage permission requests, please contact:
            </p>
            <p className="font-bold text-zinc-900 dark:text-white">
              Email: suheelhilal92@gmail.com
            </p>
          </section>
        </article>
      </motion.div>
    </div>
  );
}
