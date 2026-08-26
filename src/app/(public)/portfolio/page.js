import PortfolioNavbar from '@/components/portfolio/PortfolioNavbar';
import PortfolioHero from '@/components/portfolio/PortfolioHero';

export const metadata = {
  title: 'Full Stack Developer & UI/UX Designer | Digital Experiences That Make Impact',
  description: 'Full Stack Developer & UI/UX Designer crafting scalable, responsive and high performance web applications. Lighthouse 98+ score.',
};

export default function PortfolioPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#FAFAFA', overflow: 'hidden' }}>
      <PortfolioNavbar />
      <PortfolioHero />
    </div>
  );
}
