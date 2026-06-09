'use client';

import { motion } from 'framer-motion';
import TopLoader from '@/components/shared/TopLoader';

export default function CookiesClient() {
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
          <span className="text-[10px] font-black uppercase tracking-widest text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-500/10 px-2.5 py-1 rounded-md">
            Legal
          </span>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-zinc-900 dark:text-white font-display">
            Cookies & LocalStorage Policy
          </h1>
          <p className="text-sm font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
            Last Updated: June 8, 2026
          </p>
        </header>

        <article className="prose prose-zinc dark:prose-invert max-w-none space-y-8 text-sm md:text-base leading-relaxed text-zinc-650 dark:text-zinc-400 font-medium">
          <section className="space-y-3">
            <h2 className="text-xl md:text-2xl font-bold text-zinc-900 dark:text-white font-display">
              1. What are Cookies and LocalStorage?
            </h2>
            <p>
              Cookies are small text files placed on your device by websites that you visit. LocalStorage is an HTML5 technology that allows websites to store key-value data directly in your browser. Both technologies allow us to remember your preferences and keep your sessions authenticated across visits.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl md:text-2xl font-bold text-zinc-900 dark:text-white font-display">
              2. How We Use Browser Storage
            </h2>
            <p>
              TechyBlogs does not use tracking cookies for third-party targeted advertising. We only store functional data required for visual preference stability and administrator security:
            </p>
            <div className="overflow-x-auto mt-4 border border-zinc-200 dark:border-zinc-800 rounded-xl">
              <table className="w-full text-left text-xs md:text-sm">
                <thead>
                  <tr className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
                    <th className="p-3 font-bold">Storage Key</th>
                    <th className="p-3 font-bold">Type</th>
                    <th className="p-3 font-bold">Purpose</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 font-medium">
                  <tr>
                    <td className="p-3 font-mono text-blue-600 dark:text-blue-400">theme-storage</td>
                    <td className="p-3">LocalStorage</td>
                    <td className="p-3">Saves client-side UI preference (light vs dark mode) to ensure layout consistency immediately on page load.</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono text-blue-600 dark:text-blue-400">token</td>
                    <td className="p-3">Cookie</td>
                    <td className="p-3">Persists administrative authentication state to permit access to article dashboards and write interfaces.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl md:text-2xl font-bold text-zinc-900 dark:text-white font-display">
              3. Managing Storage Settings
            </h2>
            <p>
              You can control or clear LocalStorage and Cookie caches through your browser's settings panel. If you disable LocalStorage or clear the data:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                The site layout will default to Dark Mode on each new load.
              </li>
              <li>
                Administrators will be logged out and prompted to authenticate again.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl md:text-2xl font-bold text-zinc-900 dark:text-white font-display">
              4. Questions and Contact
            </h2>
            <p>
              If you have any questions regarding our storage practices or require clarification on how data is handled, please contact:
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
