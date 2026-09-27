'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Search, Heart, MessageCircle, Bell, User, Menu, X, Plus, Home, Compass, Shield } from 'lucide-react';

function AdminNavLinks() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get('tab') || 'dashboard';
  const isExactAdmin = pathname === '/admin';

  const links = [
    { id: 'dashboard', label: 'Dashboard', href: '/admin', icon: Shield },
    { id: 'users', label: 'Users', href: '/admin?tab=users' },
    { id: 'sells', label: 'Sells & Orders', href: '/admin?tab=sells' },
    { id: 'products', label: 'Listings', href: '/admin?tab=products' },
    { id: 'campuses', label: 'Campuses', href: '/admin?tab=campuses' },
  ];

  return (
    <nav className="hidden md:flex items-center gap-1">
      {links.map((link) => {
        const isActive = isExactAdmin && ((link.id === 'dashboard' && !searchParams.get('tab')) || currentTab === link.id);
        const Icon = link.icon;
        return (
          <Link
            key={link.id}
            href={link.href}
            className={`px-3 py-2 text-sm rounded-lg transition-colors flex items-center gap-1.5 ${
              isActive
                ? 'font-semibold text-purple-700 bg-purple-100/90 border border-purple-300 shadow-xs'
                : 'font-medium text-neutral-700 hover:text-purple-700 hover:bg-neutral-100'
            }`}
          >
            {Icon && <Icon className="w-3.5 h-3.5" />}
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function Navbar() {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 glass border-b border-neutral-200/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 shrink-0">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-600 to-electric-500 flex items-center justify-center shadow-sm shadow-brand-600/30">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M8 12l3 3 5-6" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="hidden sm:block">
                <div className="font-bold text-lg leading-none tracking-tight">CAMPUS LOOP</div>
                <div className="text-[10px] text-neutral-500 leading-none mt-0.5 tracking-wide">Keep It in the Loop</div>
              </div>
            </Link>

            {/* Desktop Nav: Distinct for Admin vs Standard User */}
            {user?.role === 'admin' ? (
              <Suspense fallback={<div className="hidden md:flex items-center gap-1 h-9" />}>
                <AdminNavLinks />
              </Suspense>
            ) : (
              <nav className="hidden md:flex items-center gap-1">
                <Link href="/explore" className="px-3 py-2 text-sm font-medium text-neutral-700 hover:text-brand-600 rounded-lg hover:bg-neutral-100 transition-colors">Explore</Link>
                <Link href="/categories" className="px-3 py-2 text-sm font-medium text-neutral-700 hover:text-brand-600 rounded-lg hover:bg-neutral-100 transition-colors">Categories</Link>
                <Link href="/rent" className="px-3 py-2 text-sm font-medium text-neutral-700 hover:text-brand-600 rounded-lg hover:bg-neutral-100 transition-colors">Rent</Link>
                <Link href="/exchange" className="px-3 py-2 text-sm font-medium text-neutral-700 hover:text-brand-600 rounded-lg hover:bg-neutral-100 transition-colors">Exchange</Link>
                <Link href="/free" className="px-3 py-2 text-sm font-medium text-neutral-700 hover:text-brand-600 rounded-lg hover:bg-neutral-100 transition-colors">Free</Link>
              </nav>
            )}

            {/* Desktop Right */}
            <div className="hidden md:flex items-center gap-2">
              <Link href="/search" className="btn btn-ghost btn-sm" aria-label="Search">
                <Search className="w-4 h-4" />
              </Link>
              {user && user.role !== 'admin' && (
                <>
                  <Link href="/wishlist" className="btn btn-ghost btn-sm" aria-label="Wishlist">
                    <Heart className="w-4 h-4" />
                  </Link>
                  <Link href="/messages" className="btn btn-ghost btn-sm" aria-label="Messages">
                    <MessageCircle className="w-4 h-4" />
                  </Link>
                  <Link href="/notifications" className="btn btn-ghost btn-sm" aria-label="Notifications">
                    <Bell className="w-4 h-4" />
                  </Link>
                </>
              )}
              {user?.role === 'admin' ? (
                <Link href="/admin" className="btn btn-sm gap-1.5 text-purple-700 bg-purple-100/80 border border-purple-300 font-semibold shadow-xs">
                  <Shield className="w-4 h-4" /> Admin Console
                </Link>
              ) : (
                <Link
                  href="/admin/login"
                  className="btn btn-sm gap-1.5 text-neutral-700 hover:text-purple-700 hover:bg-purple-50 border border-neutral-200 hover:border-purple-200 transition-colors"
                  title="Administrator Portal"
                >
                  <Shield className="w-3.5 h-3.5 text-purple-600" /> Admin
                </Link>
              )}
              {user?.role !== 'admin' && (
                <Link href="/sell" className="btn btn-primary btn-md">
                  <Plus className="w-4 h-4" />
                  Sell an Item
                </Link>
              )}
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="btn btn-ghost btn-sm gap-2"
                  >
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white text-xs font-semibold">
                      {user.profile?.fullName?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
                    </div>
                    <span className="text-sm font-medium hidden lg:inline">
                      {user.profile?.fullName || user.email.split('@')[0]}
                    </span>
                  </button>
                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-60 card p-2 shadow-lg">
                      <div className="px-3 py-2 border-b border-neutral-100 mb-1">
                        <div className="font-semibold text-sm truncate">{user.profile?.fullName || 'User'}</div>
                        <div className="text-xs text-neutral-500 truncate">{user.email}</div>
                      </div>
                      {user.role === 'admin' ? (
                        <>
                          <Link href="/admin" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm text-purple-700 font-semibold hover:bg-purple-50 rounded-lg">
                            <Shield className="w-4 h-4" /> Admin Dashboard
                          </Link>
                          <Link href="/admin?tab=users" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50 rounded-lg">
                            User Management
                          </Link>
                          <Link href="/admin?tab=sells" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50 rounded-lg">
                            Sells & Transactions
                          </Link>
                        </>
                      ) : (
                        <>
                          <Link href="/profile" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50 rounded-lg">
                            <User className="w-4 h-4" /> My Profile
                          </Link>
                          <Link href="/dashboard" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50 rounded-lg">
                            <Home className="w-4 h-4" /> Dashboard
                          </Link>
                        </>
                      )}
                      <button
                        onClick={() => { logout(); setUserMenuOpen(false); }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg text-left"
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <Link href="/login" className="btn btn-secondary btn-md">
                    Login
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile */}
            <div className="flex md:hidden items-center gap-2">
              <Link href="/admin/login" className="btn btn-ghost btn-sm text-purple-700" title="Admin Login">
                <Shield className="w-4 h-4" />
              </Link>
              <Link href="/search" className="btn btn-ghost btn-sm" aria-label="Search">
                <Search className="w-5 h-5" />
              </Link>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="btn btn-ghost btn-sm"
                aria-label="Menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-neutral-200 bg-white">
            <nav className="px-4 py-3 space-y-1">
              {user?.role === 'admin' ? (
                <>
                  <Link href="/admin" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-purple-700 font-semibold bg-purple-50">
                    <Shield className="w-5 h-5" /> Admin Dashboard
                  </Link>
                  <Link href="/admin?tab=users" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-neutral-50">
                    Users
                  </Link>
                  <Link href="/admin?tab=sells" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-neutral-50">
                    Sells & Orders
                  </Link>
                  <Link href="/admin?tab=products" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-neutral-50">
                    Listings Moderation
                  </Link>
                  <Link href="/admin?tab=campuses" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-neutral-50">
                    Campuses
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/explore" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-neutral-50">
                    <Compass className="w-5 h-5" /> Explore
                  </Link>
                  <Link href="/categories" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-neutral-50">
                    <Menu className="w-5 h-5" /> Categories
                  </Link>
                  <Link href="/rent" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-neutral-50">
                    Rent
                  </Link>
                  <Link href="/admin/login" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-purple-700 font-medium hover:bg-purple-50">
                    <Shield className="w-5 h-5" /> Admin Portal
                  </Link>
                </>
              )}
              {!user && (


                <div className="pt-2 space-y-2">
                  <Link href="/admin/login" onClick={() => setMobileMenuOpen(false)} className="btn btn-secondary w-full text-purple-700 border-purple-200">
                    <Shield className="w-4 h-4 text-purple-600" /> Admin Portal
                  </Link>
                  <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="btn btn-primary w-full">
                    Student Login / Sign Up
                  </Link>
                </div>
              )}
            </nav>
          </div>
        )}

      </header>
    </>
  );
}
