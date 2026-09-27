'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Home, Compass, PlusCircle, MessageCircle, User, Shield, Users, ShoppingBag, Package, School } from 'lucide-react';
import { cn } from '@/lib/utils';

function MobileNavContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const currentTab = searchParams.get('tab');

  if (pathname === '/admin/login') {
    return null;
  }

  if (user?.role === 'admin') {
    const adminItems = [
      { href: '/admin', tabId: 'dashboard', icon: Shield, label: 'Admin' },
      { href: '/admin?tab=users', tabId: 'users', icon: Users, label: 'Users' },
      { href: '/admin?tab=sells', tabId: 'sells', icon: ShoppingBag, label: 'Sells' },
      { href: '/admin?tab=products', tabId: 'products', icon: Package, label: 'Listings' },
      { href: '/admin?tab=campuses', tabId: 'campuses', icon: School, label: 'Campuses' },
    ];

    return (
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-purple-200/80 shadow-lg safe-bottom">
        <div className="grid grid-cols-5 gap-1 px-1 py-1.5">
          {adminItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === '/admin' &&
              ((item.tabId === 'dashboard' && !currentTab) || currentTab === item.tabId);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-xl transition-colors',
                  isActive ? 'text-purple-700 bg-purple-50 font-semibold' : 'text-neutral-500 hover:text-neutral-900'
                )}
              >
                <Icon className={cn('w-4 h-4', isActive && 'scale-110 text-purple-700')} />
                <span className="text-[10px] font-medium truncate max-w-[55px]">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    );
  }

  const items = [
    { href: '/', icon: Home, label: 'Home' },
    { href: '/explore', icon: Compass, label: 'Explore' },
    { href: '/sell', icon: PlusCircle, label: 'Sell', isSell: true },
    { href: '/messages', icon: MessageCircle, label: 'Messages' },
    { href: user ? '/dashboard' : '/login', icon: User, label: user ? 'Account' : 'Login' },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 glass border-t border-neutral-200/70 safe-bottom">
      <div className="grid grid-cols-5 gap-1 px-2 py-2">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));

          if (item.isSell) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center justify-center gap-0.5 -mt-5"
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-600 to-electric-500 flex items-center justify-center shadow-lg shadow-brand-600/30">
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 py-2 rounded-lg transition-colors',
                isActive ? 'text-brand-600' : 'text-neutral-500'
              )}
            >
              <Icon className={cn('w-5 h-5', isActive && 'scale-110')} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function MobileNav() {
  return (
    <Suspense fallback={null}>
      <MobileNavContent />
    </Suspense>
  );
}
