import { Inter, Plus_Jakarta_Sans, Lora } from "next/font/google";
import ThemeInitializer from "@/components/shared/ThemeInitializer";
import ToastContainer from "@/components/shared/ToastContainer";
import BackToTop from "@/components/shared/BackToTop";
import "./globals.css";

const fontSans = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const fontDisplay = Plus_Jakarta_Sans({
  variable: "--font-display",
  subsets: ["latin"],
});

const fontSerif = Lora({
  variable: "--font-serif",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

export const metadata = {
  metadataBase: new URL('https://teachyblogs.com'),
  title: "TeachyBlogs - Professional Web Development & Coding Blog",
  description: "Discover modern web design patterns, tutorials, frameworks, and insights into the future of software engineering.",
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
        className={`${fontSans.variable} ${fontDisplay.variable} ${fontSerif.variable} antialiased min-h-screen transition-colors duration-300 bg-zinc-50 dark:bg-[#0b0f19] text-zinc-900 dark:text-zinc-100 relative overflow-x-hidden`}
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

