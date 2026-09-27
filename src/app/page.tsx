'use client';

import Link from 'next/link';
import { Search, TrendingUp, ArrowRight, Zap, Shield, Sparkles, Package, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { ProductCard, ProductCardSkeleton, type ProductCardProps } from '@/components/ProductCard';
import { formatPrice } from '@/lib/utils';

const CATEGORY_ITEMS = [
  { name: 'Books', slug: 'books', emoji: '📚', gradient: 'from-orange-100 to-orange-50' },
  { name: 'Stationery', slug: 'stationery', emoji: '✏️', gradient: 'from-yellow-100 to-yellow-50' },
  { name: 'Electronics', slug: 'electronics', emoji: '💻', gradient: 'from-blue-100 to-blue-50' },
  { name: 'Essentials', slug: 'essentials', emoji: '🎒', gradient: 'from-purple-100 to-purple-50' },
  { name: 'Rent', slug: 'rent', emoji: '🔄', gradient: 'from-cyan-100 to-cyan-50' },
  { name: 'Exchange', slug: 'exchange', emoji: '♻️', gradient: 'from-emerald-100 to-emerald-50' },
  { name: 'Free', slug: 'free', emoji: '🎁', gradient: 'from-pink-100 to-pink-50' },
];

const FLOATING_CARDS = [
  { emoji: '📚', title: 'Engineering Book', price: '₹399' },
  { emoji: '🧮', title: 'Calculator', price: '₹799' },
  { emoji: '💻', title: 'Laptop', price: '₹25,000' },
  { emoji: '🎒', title: 'Backpack', price: '₹599' },
];

const HERO_SEARCHES = [
  'Search textbooks',
  'Scientific calculator',
  'Engineering books',
  'Laptop',
  'Hostel essentials',
];

export default function HomePage() {
  const [products, setProducts] = useState<ProductCardProps[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchPlaceholderIdx, setSearchPlaceholderIdx] = useState(0);
  const [search, setSearch] = useState('');
  const [stats, setStats] = useState({ users: 0, products: 0, campuses: 0, deals: 0 });

  useEffect(() => {
    const interval = setInterval(() => {
      setSearchPlaceholderIdx((i) => (i + 1) % HERO_SEARCHES.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetch('/api/products?limit=8&status=active')
      .then((r) => r.json())
      .then((res) => {
        const items = (res.data?.items || []).map((p: any) => ({
          id: p.id,
          title: p.title,
          price: p.price,
          condition: p.condition,
          campusName: p.campus?.name,
          sellerRating: p.sellerProfile?.rating || p.seller?.profile?.rating,
          sellerName: p.sellerProfile?.fullName || p.seller?.profile?.fullName,
          imageUrl: p.images?.[0]?.url,
          listingType: p.listingType,
        }));
        setProducts(items);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetch('/api/stats')
      .then((r) => r.json())
      .then((res) => setStats(res.data || { users: 0, products: 0, campuses: 0, deals: 0 }))
      .catch(() => setStats({ users: 0, products: 0, campuses: 0, deals: 0 }));
  }, []);


  return (
    <div className="min-h-screen">
      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-hero">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-brand-300/30 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-electric-300/20 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-12 pb-20 lg:pt-20 lg:pb-28">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/80 backdrop-blur border border-brand-200 rounded-full text-xs font-medium text-brand-700 animate-fade-in">
                <Sparkles className="w-3.5 h-3.5" />
                Campus-first marketplace for Gen-Z
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.05] animate-slide-up">
                Your Campus.{' '}
                <span className="bg-gradient-to-r from-brand-600 via-electric-500 to-fresh-500 bg-clip-text text-transparent">
                  Your Marketplace.
                </span>
              </h1>

              <p className="text-lg text-neutral-600 max-w-xl animate-slide-up" style={{ animationDelay: '0.1s' }}>
                Buy, sell, rent and exchange everything students need — right inside your campus community.
                <span className="block text-sm mt-2 text-neutral-500 italic">From Your Campus. To Your Campus.</span>
              </p>

              {/* Search */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (search.trim()) window.location.href = `/explore?q=${encodeURIComponent(search)}`;
                }}
                className="flex items-center gap-2 p-2 bg-white rounded-2xl shadow-xl shadow-brand-600/10 border border-neutral-200 max-w-xl animate-slide-up"
                style={{ animationDelay: '0.2s' }}
              >
                <Search className="w-5 h-5 text-neutral-400 ml-3 shrink-0" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={HERO_SEARCHES[searchPlaceholderIdx]}
                  className="flex-1 px-2 py-2.5 bg-transparent outline-none text-neutral-900 placeholder:text-neutral-400"
                />
                <button type="submit" className="btn btn-primary btn-md">
                  Search
                </button>
              </form>

              <div className="flex flex-wrap gap-3 animate-slide-up" style={{ animationDelay: '0.3s' }}>
                <Link href="/explore" className="btn btn-secondary btn-md">
                  Explore Marketplace <ArrowRight className="w-4 h-4" />
                </Link>
                <Link href="/sell" className="btn btn-primary btn-md">
                  Sell an Item
                </Link>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-4 gap-4 pt-6 animate-slide-up" style={{ animationDelay: '0.4s' }}>
                {[
                  { label: 'Students', value: stats.users, icon: Users },
                  { label: 'Listings', value: stats.products, icon: Package },
                  { label: 'Campuses', value: stats.campuses, icon: Shield },
                  { label: 'Deals', value: stats.deals, icon: Zap },
                ].map((stat) => (
                  <div key={stat.label} className="text-center">
                    <div className="text-2xl font-bold text-neutral-900">
                      {stat.value.toLocaleString('en-IN')}+
                    </div>
                    <div className="text-xs text-neutral-500 mt-0.5">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Visual - Floating cards */}
            <div className="relative hidden lg:block h-[500px]">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative w-80 h-80">
                  <div className="absolute inset-0 bg-gradient-to-br from-brand-500/20 to-electric-500/20 rounded-full blur-3xl" />
                  <div className="relative w-full h-full rounded-full bg-gradient-to-br from-brand-100 to-electric-100 border border-white shadow-2xl flex items-center justify-center">
                    <div className="text-center space-y-2">
                      <div className="text-7xl">🎓</div>
                      <div className="text-xl font-bold text-brand-700">Campus Loop</div>
                      <div className="text-xs text-neutral-600">Keep it in the Loop</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating cards */}
              {FLOATING_CARDS.map((card, i) => {
                const positions = [
                  { top: '10%', left: '-5%', delay: '0s' },
                  { top: '15%', right: '-5%', delay: '1.5s' },
                  { bottom: '15%', left: '-8%', delay: '0.75s' },
                  { bottom: '10%', right: '-8%', delay: '2.25s' },
                ];
                return (
                  <div
                    key={i}
                    className="absolute card p-3 w-48 animate-float"
                    style={{ ...positions[i], animationDelay: positions[i].delay }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-3xl">{card.emoji}</div>
                      <div>
                        <div className="text-sm font-semibold">{card.title}</div>
                        <div className="text-xs text-brand-600 font-bold">{card.price}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold">Shop by Category</h2>
            <p className="text-neutral-600 mt-1">Find exactly what you need on campus</p>
          </div>
          <Link href="/categories" className="hidden sm:inline-flex btn btn-ghost btn-md">
            View all <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {CATEGORY_ITEMS.map((cat) => (
            <Link
              key={cat.slug}
              href={`/explore?category=${cat.slug}`}
              className={`group card p-5 bg-gradient-to-br ${cat.gradient} hover:scale-[1.03] transition-transform`}
            >
              <div className="text-4xl mb-3">{cat.emoji}</div>
              <div className="font-semibold text-sm text-neutral-900">{cat.name}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* TRENDING PRODUCTS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="flex items-end justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-electric-500 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold">Trending on Campus</h2>
              <p className="text-neutral-600 text-sm">Hot picks from students like you</p>
            </div>
          </div>
          <Link href="/explore" className="btn btn-ghost btn-md hidden sm:inline-flex">
            View all <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {loading
            ? Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)
            : products.map((p) => <ProductCard key={p.id} {...p} />)}
        </div>

        {!loading && products.length === 0 && (
          <div className="text-center py-16 text-neutral-500">
            No products yet. <Link href="/sell" className="text-brand-600 font-medium">Be the first to sell →</Link>
          </div>
        )}
      </section>

      {/* CAMPUS SELECTOR */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="card p-8 md:p-12 bg-gradient-to-br from-brand-600 to-electric-600 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-3">Start With Your Campus</h2>
              <p className="text-white/90 mb-6">
                Join thousands of students buying and selling within their campus community. Local deals, trusted sellers, fast exchanges.
              </p>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2"><Shield className="w-4 h-4" /> Verified Students</div>
                <div className="flex items-center gap-2"><Zap className="w-4 h-4" /> Instant Connections</div>
              </div>
            </div>
            <div>
              <Link
                href="/explore"
                className="block bg-white text-neutral-900 rounded-2xl p-4 hover:bg-neutral-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-xl">🎓</div>
                  <div className="flex-1">
                    <div className="font-semibold">Search your campus...</div>
                    <div className="text-xs text-neutral-500">42 campuses · 12,000+ students</div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-neutral-400" />
                </div>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* WHY CAMPUS LOOP */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold">Why Campus Loop?</h2>
          <p className="text-neutral-600 mt-2">Built specifically for the way students actually live.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: Shield, title: 'Verified Students', desc: 'Every seller is a real student from your campus. Verified email, verified phone, verified trust.' },
            { icon: Zap, title: 'Lightning Fast', desc: 'Find textbooks, calculators, laptops, and essentials in seconds. Same campus = instant meetup.' },
            { icon: Sparkles, title: 'Buy · Sell · Rent · Swap', desc: 'Don\'t just buy. Rent that textbook for a semester. Swap novels. Give away things you don\'t need.' },
          ].map((f) => (
            <div key={f.title} className="card p-6 hover:-translate-y-1 transition-transform">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-100 to-electric-100 flex items-center justify-center mb-4">
                <f.icon className="w-6 h-6 text-brand-600" />
              </div>
              <h3 className="font-bold text-lg mb-2">{f.title}</h3>
              <p className="text-sm text-neutral-600">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
