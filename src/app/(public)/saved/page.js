import SavedClient from '@/components/pages/SavedClient';

export const metadata = {
  title: 'Saved Articles | TeachyBlogs',
  description: 'View your saved and bookmarked articles on TeachyBlogs.',
  robots: { index: false, follow: false },
};

export default function SavedPage() {
  return <SavedClient />;
}
