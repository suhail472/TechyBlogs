import { Manrope, Plus_Jakarta_Sans, Lora, Bodoni_Moda } from 'next/font/google';
import ThemeInitializer from "@/components/shared/ThemeInitializer";
import ToastContainer from "@/components/shared/ToastContainer";
import BackToTop from "@/components/shared/BackToTop";
import "./globals.css";
import "katex/dist/katex.min.css";

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
  weight: ['500', '600', '700', '800'],
});

const lora = Lora({
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
});

const bodoniModa = Bodoni_Moda({
  subsets: ['latin'],
  variable: '--font-accent',
  display: 'swap',
  weight: ['700', '800', '900'],
});

export const metadata = {
  metadataBase: new URL('https://techyblogs.com'),
  title: "TechyBlogs - Modern Digital Publishing Platform & Journal",
  description: "Independent reporting, technical guides, product reviews, and regional news across Technology, Education, Kashmir, and Culture.",
  icons: {
    icon: '/favicon.ico',
  },
  alternates: {
    types: {
      'application/rss+xml': '/feed.xml',
    },
  },
  openGraph: {
    siteName: 'TechyBlogs',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
  },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${manrope.variable} ${plusJakartaSans.variable} ${lora.variable} ${bodoniModa.variable} scroll-smooth overflow-x-hidden`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: `
          try {
            const storage = localStorage.getItem('theme-storage');
            if (storage) {
              const parsed = JSON.parse(storage);
              if (parsed.state && parsed.state.theme === 'dark') {
                document.documentElement.classList.add('dark');
              } else if (parsed.state && parsed.state.theme === 'light') {
                document.documentElement.classList.remove('dark');
              }
            } else {
              document.documentElement.classList.add('dark');
            }
          } catch (e) {
            document.documentElement.classList.add('dark');
          }
        `}} />
      </head>
      <body className="min-h-screen bg-white dark:bg-[#0c0e12] text-zinc-900 dark:text-zinc-100 antialiased selection:bg-red-500/20 selection:text-red-600 dark:selection:text-red-400 font-sans overflow-x-hidden">
        <ThemeInitializer />
        {children}
        <ToastContainer />
        <BackToTop />
      </body>
    </html>
  );
}
