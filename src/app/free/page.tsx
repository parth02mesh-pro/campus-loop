'use client';

import { useEffect, useState } from 'react';
import { ProductCard, ProductCardSkeleton, type ProductCardProps } from '@/components/ProductCard';
import { Heart } from 'lucide-react';

export default function FreePage() {
  const [products, setProducts] = useState<ProductCardProps[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/products?listingType=free&status=active&limit=16')
      .then((r) => r.json())
      .then((res) => {
        const items = (res.data?.items || []).map((p: any) => ({
          id: p.id,
          title: p.title,
          price: '0',
          condition: p.condition,
          campusName: p.campus?.name,
          sellerRating: p.sellerProfile?.rating,
          sellerName: p.sellerProfile?.fullName,
          imageUrl: p.images?.[0]?.url,
          listingType: p.listingType,
        }));
        setProducts(items);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="card p-8 mb-8 bg-gradient-to-br from-red-500 to-pink-500 text-white">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
            <Heart className="w-6 h-6" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold">🎁 Give It a New Home</h1>
        </div>
        <p className="text-white/90">Free items from students who want to give back. Claim what you need, share what you don't.</p>
      </div>

      <h2 className="text-2xl font-bold mb-6">Free Items</h2>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {loading
          ? Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)
          : products.map((p) => <ProductCard key={p.id} {...p} />)}
      </div>

      {!loading && products.length === 0 && (
        <div className="text-center py-16 text-neutral-500">
          <div className="text-6xl mb-4">🎁</div>
          <h3 className="font-semibold text-lg mb-2">No free items right now</h3>
          <p>Check back soon or list something for free</p>
        </div>
      )}
    </div>
  );
}
