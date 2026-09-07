import SavedClient from '@/components/pages/SavedClient';

export const metadata = {
  title: 'Saved Articles | TechyBlogs',
  description: 'View your saved and bookmarked articles on TechyBlogs.',
  robots: { index: false, follow: false },
};

export default function SavedPage() {
  return <SavedClient />;
}
