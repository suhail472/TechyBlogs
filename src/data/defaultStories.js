import { PRODUCTION_ARTICLES } from './productionArticles.js';

export const DEFAULT_AUTHORS = [
  {
    _id: 'author-suheel',
    name: 'Suheel Hilal',
    slug: 'suheel-hilal',
    username: 'suheel',
    email: 'suheel@teachyblogs.com',
    role: 'Editor-in-Chief & Principal Architect',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400&h=400',
    bio: 'Principal Software Architect and Lead Editor at TeachyBlogs. Specializes in distributed systems, Next.js, React architectures, and web standards.',
    expertise: ['Next.js 15', 'React Server Components', 'Distributed Systems', 'Cloud Architecture'],
    website: 'https://teachyblogs.com/about',
  },
  {
    _id: 'author-zehra',
    name: 'Zehra Mir',
    slug: 'zehra-mir',
    username: 'zehra',
    email: 'zehra@teachyblogs.com',
    role: 'Senior Regional Correspondent',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400&h=400',
    bio: 'Senior Regional Correspondent covering Jammu & Kashmir education, regional development, cultural heritage, and ecological sustainability.',
    expertise: ['Higher Education', 'Kashmir Affairs', 'Policy Analysis', 'Cultural Heritage'],
    website: 'https://teachyblogs.com/about',
  },
  {
    _id: 'author-aarav',
    name: 'Aarav Sharma',
    slug: 'aarav-sharma',
    username: 'aarav',
    email: 'aarav@teachyblogs.com',
    role: 'Hardware & Tech Reviewer',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400&h=400',
    bio: 'Hardware and Consumer Technology reviewer with a decade of benchmarking experience across laptops, phones, semiconductors, and developer tooling.',
    expertise: ['Apple Silicon', 'Hardware Benchmarks', 'Product Reviews', 'Developer Workflows'],
    website: 'https://teachyblogs.com/about',
  },
  {
    _id: 'author-priya',
    name: 'Priya Narang',
    slug: 'priya-narang',
    username: 'priya',
    email: 'priya@teachyblogs.com',
    role: 'Financial & Startup Analyst',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=400&h=400',
    bio: 'Financial markets and venture capital analyst tracking deeptech, AI infrastructure, fintech startups, and macroeconomic trends across South Asia.',
    expertise: ['Venture Capital', 'DeepTech', 'Indian Economy', 'Micro-SaaS'],
    website: 'https://teachyblogs.com/about',
  },
  {
    _id: 'author-tariq',
    name: 'Dr. Tariq Lone',
    slug: 'dr-tariq-lone',
    username: 'tariqlone',
    email: 'tariq@teachyblogs.com',
    role: 'Academician & Alpine Guide',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400&h=400',
    bio: 'Education researcher, high-altitude mountaineer, and certified ski guide documenting Himalayan biodiversity, entrance preparation, and outdoor expeditions.',
    expertise: ['GATE / Academic Strategy', 'Alpine Expeditions', 'Himalayan Ecology', 'Adventure Sports'],
    website: 'https://teachyblogs.com/about',
  },
];

const ARTICLE_IMAGES = {
  'architecture-next-gen-edge-ai-multimodal-models':
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=1200&h=630',
  'apple-m4-max-macbook-pro-scorecard-benchmarks-review':
    'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&q=80&w=1200&h=630',
  'kashmir-saffron-harvest-chinars-high-altitude-ecology':
    'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&q=80&w=1200&h=630',
  'gate-iit-jee-2026-academic-preparation-strategy-blueprint':
    'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80&w=1200&h=630',
  'death-of-monolithic-frontend-distributed-micro-edge-runtimes':
    'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=1200&h=630',
  'keychron-q1-max-mechanical-keyboard-review-scorecard':
    'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&q=80&w=1200&h=630',
  'srinagar-tech-corridors-remote-engineers-startup-renaissance':
    'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&q=80&w=1200&h=630',
  'inside-react-19-compiler-automatic-memoization-architecture':
    'https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&q=80&w=1200&h=630',
};

export const DEFAULT_STORIES = PRODUCTION_ARTICLES.map((article) => {
  const authorObj = DEFAULT_AUTHORS.find((a) => a._id === article.primaryAuthorId) || DEFAULT_AUTHORS[0];
  const image = ARTICLE_IMAGES[article.slug] || 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=1200&h=630';

  return {
    ...article,
    image,
    primaryAuthor: authorObj,
    primarySection: {
      name: article.categories[0] || 'Technology',
      slug: article.primarySectionSlug || 'technology',
    },
    primaryTopic: {
      name: article.tags[0] || 'Software',
      slug: article.primaryTopicSlug || 'software',
    },
    primaryRegion: article.categories.includes('Kashmir')
      ? { name: 'Kashmir Valley', slug: 'kashmir' }
      : null,
    editions: article.categories.includes('Kashmir')
      ? [{ name: 'Kashmir Edition', slug: 'kashmir' }]
      : [{ name: 'Global Edition', slug: 'global' }],
  };
});

export default DEFAULT_STORIES;
