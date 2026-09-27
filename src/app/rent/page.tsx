'use client';

import { useEffect, useState } from 'react';
import { ProductCard, ProductCardSkeleton, type ProductCardProps } from '@/components/ProductCard';
import { Clock, Calendar, DollarSign, Shield } from 'lucide-react';

export default function RentPage() {
  const [products, setProducts] = useState<ProductCardProps[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/products?listingType=rent&status=active&limit=16')
      .then((r) => r.json())
      .then((res) => {
        const items = (res.data?.items || []).map((p: any) => ({
          id: p.id,
          title: p.title,
          price: p.rentalPriceDaily || p.price,
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
      <div className="card p-8 mb-8 bg-gradient-to-br from-electric-500 to-brand-600 text-white">
        <h1 className="text-3xl md:text-4xl font-bold mb-3">Need it for a semester? Don't buy it. Rent it.</h1>
        <p className="text-white/90 mb-6">Save money, save space. Rent textbooks, equipment and more from fellow students.</p>
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { icon: Clock, label: 'Daily, weekly, monthly' },
            { icon: Calendar, label: 'Semester rentals' },
            { icon: Shield, label: 'Verified students only' },
          ].map((f) => (
            <div key={f.label} className="flex items-center gap-2 bg-white/10 rounded-xl p-3">
              <f.icon className="w-5 h-5" />
              <span className="text-sm font-medium">{f.label}</span>
            </div>
          ))}
        </div>
      </div>

      <h2 className="text-2xl font-bold mb-6">Available for Rent</h2>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {loading
          ? Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)
          : products.map((p) => <ProductCard key={p.id} {...p} />)}
      </div>

      {!loading && products.length === 0 && (
        <div className="text-center py-16 text-neutral-500">
          <div className="text-6xl mb-4">🔄</div>
          <h3 className="font-semibold text-lg mb-2">No rentals available yet</h3>
          <p>Be the first to list an item for rent</p>
        </div>
      )}
    </div>
  );
}
