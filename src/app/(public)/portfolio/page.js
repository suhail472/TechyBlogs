import PortfolioNavbar from '@/components/portfolio/PortfolioNavbar';
import PortfolioHero from '@/components/portfolio/PortfolioHero';

export const metadata = {
  title: 'Full Stack Developer & UI/UX Designer Portfolio | Digital Experiences That Make Impact',
  description: 'Full Stack Developer & UI/UX Designer crafting scalable, responsive and high performance web applications.',
  openGraph: {
    title: 'I Build Digital Experiences That Make Impact',
    description: 'Full Stack Developer & UI/UX Designer portfolio showcasing high-performance web applications, clean code architecture, and Lighthouse 98+ score.',
    type: 'website',
  },
};

export default function PortfolioPage() {
  return (
    <div className="min-h-screen bg-[#FBFBFD] dark:bg-[#090A0F] text-[#111317] dark:text-zinc-100 overflow-x-hidden relative">
      {/* Top Navbar from Design */}
      <PortfolioNavbar />

      {/* Main Hero Showcase from Design */}
      <PortfolioHero />
    </div>
  );
}
