'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Star, Package, ShoppingBag, Calendar, MapPin, BookOpen } from 'lucide-react';
import { ProductCard, ProductCardSkeleton, type ProductCardProps } from '@/components/ProductCard';
import { formatDate } from '@/lib/utils';

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState('listings');
  const [products, setProducts] = useState<ProductCardProps[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user) return;
    fetch('/api/products?status=active&limit=20')
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
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  if (authLoading) return <div className="p-8 text-center">Loading...</div>;
  if (!user) return null;

  const profile = user.profile;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <div className="card p-6 sm:p-8 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-brand-500 to-electric-500 flex items-center justify-center text-white text-3xl font-bold shrink-0">
            {profile?.fullName?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold">{profile?.fullName || 'User'}</h1>
              {(user.isEmailVerified || user.isPhoneVerified) && (
                <span className="badge bg-fresh-100 text-fresh-700">
                  <CheckCircle2 className="w-3 h-3" /> Verified Student
                </span>
              )}
            </div>
            <p className="text-neutral-600 mt-1">{user.email}</p>
            <div className="flex flex-wrap gap-4 mt-3 text-sm text-neutral-600">
              {profile?.campusName && (
                <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {profile.campusName}</span>
              )}
              {profile?.courseName && (
                <span className="flex items-center gap-1"><BookOpen className="w-4 h-4" /> {profile.courseName}</span>
              )}
              {profile?.year && (
                <span>Year {profile.year} · Sem {profile.semester}</span>
              )}
              {profile?.rating && parseFloat(profile.rating) > 0 && (
                <span className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  {parseFloat(profile.rating).toFixed(1)} ({profile.totalRatings})
                </span>
              )}
            </div>
          </div>
          <Link href="/dashboard" className="btn btn-secondary btn-md">
            Edit Profile
          </Link>
        </div>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto no-scrollbar">
        {[
          { id: 'listings', label: 'Listings', icon: Package },
          { id: 'orders', label: 'Orders', icon: ShoppingBag },
          { id: 'reviews', label: 'Reviews', icon: Star },
          { id: 'wishlist', label: 'Wishlist' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
              tab === t.id ? 'bg-brand-600 text-white' : 'bg-white text-neutral-700 hover:bg-neutral-50 border border-neutral-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'listings' && (
        <div>
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)}
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.map((p) => <ProductCard key={p.id} {...p} />)}
            </div>
          ) : (
            <div className="card p-12 text-center">
              <div className="text-6xl mb-4">📦</div>
              <h3 className="font-semibold text-lg mb-2">No listings yet</h3>
              <p className="text-neutral-600 mb-6">Start selling to your campus community</p>
              <Link href="/sell" className="btn btn-primary btn-md">Create Listing</Link>
            </div>
          )}
        </div>
      )}

      {tab === 'orders' && (
        <div className="card p-12 text-center">
          <ShoppingBag className="w-12 h-12 mx-auto mb-3 text-neutral-300" />
          <h3 className="font-semibold text-lg mb-2">No orders yet</h3>
          <p className="text-neutral-600">When you buy items, they'll show up here</p>
        </div>
      )}

      {tab === 'reviews' && (
        <div className="card p-12 text-center">
          <Star className="w-12 h-12 mx-auto mb-3 text-neutral-300" />
          <h3 className="font-semibold text-lg mb-2">No reviews yet</h3>
          <p className="text-neutral-600">Reviews from other students will appear here</p>
        </div>
      )}

      {tab === 'wishlist' && (
        <div className="card p-12 text-center">
          <div className="text-6xl mb-4">❤️</div>
          <h3 className="font-semibold text-lg mb-2">Your wishlist is empty</h3>
          <p className="text-neutral-600">Click the heart on any product to save it</p>
        </div>
      )}
    </div>
  );
}
