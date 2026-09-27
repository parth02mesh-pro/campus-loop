'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Package, ShoppingBag, Heart, MessageCircle, Star, TrendingUp, DollarSign, Plus } from 'lucide-react';
import { ProductCard, type ProductCardProps } from '@/components/ProductCard';
import { formatPrice } from '@/lib/utils';

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<ProductCardProps[]>([]);
  const [stats, setStats] = useState({ active: 0, sold: 0, revenue: 0, rating: 0 });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user) return;
    fetch('/api/products?status=active&limit=8')
      .then((r) => r.json())
      .then((res) => {
        const myProducts = (res.data?.items || [])
          .filter((p: any) => p.sellerId === user.id)
          .map((p: any) => ({
            id: p.id,
            title: p.title,
            price: p.price,
            condition: p.condition,
            campusName: p.campus?.name,
            sellerRating: p.sellerProfile?.rating,
            imageUrl: p.images?.[0]?.url,
            listingType: p.listingType,
          }));
        setProducts(myProducts);
        setStats({
          active: myProducts.length,
          sold: 0,
          revenue: 0,
          rating: parseFloat(user.profile?.rating as string || '0'),
        });
      })
      .catch(() => {});
  }, [user]);

  if (authLoading) return <div className="p-8 text-center">Loading...</div>;
  if (!user) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Welcome back 👋</h1>
          <p className="text-neutral-600 mt-1">{user.profile?.fullName || user.email}</p>
        </div>
        <Link href="/sell" className="btn btn-primary btn-md">
          <Plus className="w-4 h-4" /> Sell an Item
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Active Listings', value: stats.active, icon: Package, color: 'from-brand-500 to-brand-600' },
          { label: 'Items Sold', value: stats.sold, icon: ShoppingBag, color: 'from-electric-500 to-electric-600' },
          { label: 'Revenue', value: formatPrice(stats.revenue), icon: DollarSign, color: 'from-fresh-500 to-fresh-600' },
          { label: 'Rating', value: stats.rating.toFixed(1), icon: Star, color: 'from-yellow-500 to-orange-500' },
        ].map((stat) => (
          <div key={stat.label} className="card p-5">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-3`}>
              <stat.icon className="w-5 h-5 text-white" />
            </div>
            <div className="text-2xl font-bold mb-1">{stat.value}</div>
            <div className="text-xs text-neutral-600">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto no-scrollbar">
        {['Active Listings', 'Orders', 'Rentals', 'Messages', 'Wishlist'].map((tab, i) => (
          <button
            key={tab}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
              i === 0 ? 'bg-brand-600 text-white' : 'bg-white text-neutral-700 hover:bg-neutral-50 border border-neutral-200'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Products */}
      <div>
        <h2 className="text-xl font-bold mb-4">Your Active Listings</h2>
        {products.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((p) => (
              <ProductCard key={p.id} {...p} />
            ))}
          </div>
        ) : (
          <div className="card p-12 text-center">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="font-semibold text-lg mb-2">No listings yet</h3>
            <p className="text-neutral-600 mb-6">Start selling items to your campus community</p>
            <Link href="/sell" className="btn btn-primary btn-md">
              <Plus className="w-4 h-4" /> Create Your First Listing
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
