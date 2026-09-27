import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/Providers';
import { Navbar } from '@/components/Navbar';
import { MobileNav } from '@/components/MobileNav';
import { Footer } from '@/components/Footer';
import { AuthProvider } from '@/contexts/AuthContext';

export const metadata: Metadata = {
  title: 'Campus Loop — From Your Campus. To Your Campus.',
  description: 'The Gen-Z student marketplace for buying, selling, renting and exchanging everything on campus.',
  keywords: ['student marketplace', 'campus', 'buy sell', 'rent', 'exchange', 'books', 'electronics'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>
          <AuthProvider>
            <div className="min-h-screen flex flex-col">
              <Navbar />
              <main className="flex-1">{children}</main>
              <Footer />
              <MobileNav />
            </div>
          </AuthProvider>
        </Providers>
      </body>
    </html>
  );
}
