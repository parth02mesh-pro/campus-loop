import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-white border-t border-neutral-200 mt-16 mb-16 md:mb-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-600 to-electric-500 flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M8 12l3 3 5-6" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span className="font-bold text-lg">CAMPUS LOOP</span>
            </Link>
            <p className="mt-3 text-sm text-neutral-600 max-w-md">
              From Your Campus. To Your Campus. The marketplace built for students to buy, sell, rent and exchange everything they need.
            </p>
            <p className="mt-2 text-xs text-neutral-500 italic">Keep It Moving. Keep It in the Loop.</p>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-3">Explore</h4>
            <ul className="space-y-2 text-sm text-neutral-600">
              <li><Link href="/explore" className="hover:text-brand-600">Marketplace</Link></li>
              <li><Link href="/categories" className="hover:text-brand-600">Categories</Link></li>
              <li><Link href="/rent" className="hover:text-brand-600">Rent Items</Link></li>
              <li><Link href="/exchange" className="hover:text-brand-600">Exchange</Link></li>
              <li><Link href="/free" className="hover:text-brand-600">Free Items</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-3">Company</h4>
            <ul className="space-y-2 text-sm text-neutral-600">
              <li><Link href="/about" className="hover:text-brand-600">About Us</Link></li>
              <li><Link href="/contact" className="hover:text-brand-600">Contact</Link></li>
              <li><Link href="/privacy" className="hover:text-brand-600">Privacy</Link></li>
              <li><Link href="/terms" className="hover:text-brand-600">Terms</Link></li>
              <li><Link href="/safety" className="hover:text-brand-600">Safety</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-neutral-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-neutral-500">© 2026 Campus Loop. Built for students, by students.</p>
          <div className="flex items-center gap-4 text-xs text-neutral-500">
            <span>🇮🇳 Made in India</span>
            <span>💜 Campus-first</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
