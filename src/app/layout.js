import ThemeInitializer from "@/components/shared/ThemeInitializer";
import ToastContainer from "@/components/shared/ToastContainer";
import BackToTop from "@/components/shared/BackToTop";
import "./globals.css";

export const metadata = {
  metadataBase: new URL('https://teachyblogs.com'),
  title: "TeachyBlogs - Modern Digital Publishing Platform & Journal",
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
    siteName: 'TeachyBlogs',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Lora:ital,wght@0,400;0,600;1,400&family=Plus+Jakarta+Sans:wght@600;700;800;900&display=swap"
          rel="stylesheet"
        />
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
          } catch (_) {}
        `}} />
      </head>
      <body
        className="antialiased min-h-screen transition-colors duration-300 bg-zinc-50 dark:bg-[#0b0f19] text-zinc-900 dark:text-zinc-100 relative overflow-x-hidden"
        suppressHydrationWarning
      >
        <ThemeInitializer />
        
        {/* Animated background blobs for premium depth */}
        <div className="absolute top-0 left-[-10%] w-[50%] h-[500px] bg-gradient-to-br from-blue-500/8 via-indigo-500/5 to-transparent dark:from-blue-500/4 dark:via-indigo-500/3 blur-[120px] rounded-full pointer-events-none -z-10 animate-blob-drift" />
        <div className="absolute top-[30%] right-[-10%] w-[45%] h-[500px] bg-gradient-to-br from-indigo-500/8 via-violet-500/5 to-transparent dark:from-indigo-500/4 dark:via-indigo-500/2 blur-[120px] rounded-full pointer-events-none -z-10 animate-blob-drift-reverse" />
        <div className="absolute bottom-0 left-[-5%] w-[45%] h-[500px] bg-gradient-to-br from-violet-500/8 via-fuchsia-500/5 to-transparent dark:from-violet-500/3 dark:via-fuchsia-500/2 blur-[120px] rounded-full pointer-events-none -z-10 animate-blob-drift" />
        
        <div className="relative z-10 flex flex-col min-h-screen">
          {children}
        </div>
        <ToastContainer />
        <BackToTop />
      </body>
    </html>
  );
}
