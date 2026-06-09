import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import SearchModal from '@/components/shared/SearchModal';

export default function PublicLayout({ children }) {
  return (
    <>
      <Navbar />
      <SearchModal />
      <main className="flex-grow">
        {children}
      </main>
      <Footer />
    </>
  );
}
