'use client';

import { motion } from 'framer-motion';
import TopLoader from '@/components/shared/TopLoader';

export default function PrivacyClient() {
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
          <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-2.5 py-1 rounded-md">
            Legal
          </span>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-zinc-900 dark:text-white font-display">
            Privacy Policy
          </h1>
          <p className="text-sm font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
            Last Updated: June 8, 2026
          </p>
        </header>

        <article className="prose prose-zinc dark:prose-invert max-w-none space-y-8 text-sm md:text-base leading-relaxed text-zinc-650 dark:text-zinc-400 font-medium">
          <section className="space-y-3">
            <h2 className="text-xl md:text-2xl font-bold text-zinc-900 dark:text-white font-display">
              1. Overview & Scope
            </h2>
            <p>
              Welcome to TechyBlogs. We value your privacy and are committed to protecting your personal data. This Privacy Policy describes how we collect, use, store, and share information when you visit or interact with our website. It applies to all users browsing public content, subscribing to our author newsletter, or accessing administrative interfaces.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl md:text-2xl font-bold text-zinc-900 dark:text-white font-display">
              2. Information We Collect
            </h2>
            <p>
              We limit data collection to what is necessary for site performance and communication:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Newsletter Information:</strong> When you subscribe to our newsletter in the footer or sidebar widgets, we collect your email address. This is stored securely and used solely to send updates, tutorials, and articles.
              </li>
              <li>
                <strong>Contact Form Data:</strong> When you send a message via our contact form, we collect your full name, email address, message subject, and content to reply to your inquiry.
              </li>
              <li>
                <strong>Technical / Session Logs:</strong> We collect standard web traffic parameters (such as browser details and general geographical location) to help monitor site reliability and optimize page load performance.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl md:text-2xl font-bold text-zinc-900 dark:text-white font-display">
              3. Client Storage & Cookie Technologies
            </h2>
            <p>
              We use standard client-side browser storage structures (like Cookies and LocalStorage keys) to maintain state consistency across page transitions:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Zustand Theme Settings:</strong> We store the user's selected layout preferences (`light` or `dark` mode) under the LocalStorage key <code>theme-storage</code>. This ensures that the selected style is painted immediately on subsequent visits without visual flicker.
              </li>
              <li>
                <strong>Session Authentication:</strong> When administrators access the control panels, a secure JWT access credentials key is persisted in Cookies to verify session validity.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl md:text-2xl font-bold text-zinc-900 dark:text-white font-display">
              4. Data Retention & Protection
            </h2>
            <p>
              We implement industry-standard server-side security measures and token verification gates to safeguard collected information. Superadmin authorization credentials are fully encrypted using modern bcrypt-level cryptographic hashes. We never sell, rent, or lease email lists or form submissions to marketing companies or third-party brokers.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl md:text-2xl font-bold text-zinc-900 dark:text-white font-display">
              5. Your Rights & Contact Details
            </h2>
            <p>
              You may opt out of our newsletter subscription list at any time by clicking the unsubscribe link inside our newsletter or by emailing us directly. For any privacy inquiries, data deletion requests, or questions regarding cookies, please contact:
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
