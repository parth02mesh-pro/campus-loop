'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Heart, ShoppingBag, ArrowRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { ProductCard, type ProductCardProps } from '@/components/ProductCard';

export default function WishlistPage() {
  const { user, loading: authLoading } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWishlist = async () => {
    try {
      const res = await fetch('/api/wishlist');
      if (res.ok) {
        const data = await res.json();
        setItems(data.data || []);
      }
    } catch (err) {
      console.error('Failed to load wishlist:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchWishlist();
    } else {
      setLoading(false);
    }
  }, [user]);

  const handleToggleWishlist = async (productId: string) => {
    try {
      const res = await fetch('/api/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId }),
      });
      if (res.ok) {
        setItems((prev) => prev.filter((i) => i.id !== productId));
      }
    } catch (err) {
      console.error('Error toggling wishlist:', err);
    }
  };

  if (authLoading || (user && loading)) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 text-center">
        <div className="animate-spin w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-neutral-500">Loading your wishlist...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="text-6xl mb-4">❤️</div>
        <h1 className="text-2xl font-bold mb-2">Save Your Favorites</h1>
        <p className="text-neutral-600 mb-6">Log in to view and save items to your personal wishlist</p>
        <Link href="/login" className="btn btn-primary btn-md">
          Login to Continue
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            Your Wishlist <span className="text-sm font-normal text-neutral-500">({items.length} items)</span>
          </h1>
          <p className="text-neutral-600 mt-1">Items you've saved for later</p>
        </div>
        <Link href="/explore" className="btn btn-secondary btn-sm">
          Browse More <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="card p-12 max-w-md mx-auto text-center">
          <Heart className="w-12 h-12 mx-auto mb-3 text-neutral-300" />
          <h3 className="font-semibold text-lg mb-2">Your wishlist is empty</h3>
          <p className="text-neutral-600 text-sm mb-6">
            Tap the heart icon on any product to keep track of items you like.
          </p>
          <Link href="/explore" className="btn btn-primary btn-md">
            Explore Marketplace
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((p) => {
            const cardProps: ProductCardProps = {
              id: p.id,
              title: p.title,
              price: p.price,
              condition: p.condition,
              campusName: p.campus?.name,
              sellerRating: p.sellerProfile?.rating,
              sellerName: p.sellerProfile?.fullName,
              imageUrl: p.images?.[0]?.url,
              listingType: p.listingType,
              isWishlisted: true,
              onWishlistToggle: () => handleToggleWishlist(p.id),
            };
            return <ProductCard key={p.id} {...cardProps} />;
          })}
        </div>
      )}
    </div>
  );
}
