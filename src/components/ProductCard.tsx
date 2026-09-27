'use client';

import Link from 'next/link';
import { Heart, Star, CheckCircle2 } from 'lucide-react';
import { formatPrice, getConditionBadge, cn } from '@/lib/utils';
import { useState } from 'react';

export interface ProductCardProps {
  id: string;
  title: string;
  price: number | string | null;
  condition: string;
  campusName?: string | null;
  sellerRating?: number | string | null;
  sellerName?: string;
  imageUrl?: string | null;
  listingType: string;
  isVerified?: boolean;
  isWishlisted?: boolean;
  onWishlistToggle?: (id: string) => void;
}

export function ProductCard({
  id,
  title,
  price,
  condition,
  campusName,
  sellerRating,
  sellerName,
  imageUrl,
  listingType,
  isVerified,
  isWishlisted,
  onWishlistToggle,
}: ProductCardProps) {
  const [wishlisted, setWishlisted] = useState(isWishlisted);
  const condBadge = getConditionBadge(condition);

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setWishlisted(!wishlisted);
    onWishlistToggle?.(id);
  };

  const listingBadge = () => {
    if (listingType === 'rent') return <span className="badge bg-electric-500/10 text-electric-600">🔄 Rent</span>;
    if (listingType === 'exchange') return <span className="badge bg-fresh-500/10 text-fresh-600">♻️ Swap</span>;
    if (listingType === 'free') return <span className="badge bg-red-100 text-red-600">🎁 Free</span>;
    return null;
  };

  return (
    <Link href={`/products/${id}`} className="group card overflow-hidden block">
      <div className="relative aspect-square bg-neutral-100 overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl bg-gradient-to-br from-brand-100 to-electric-50">
            📦
          </div>
        )}

        <button
          onClick={handleWishlist}
          className={cn(
            'absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center transition-all',
            wishlisted
              ? 'bg-red-500 text-white shadow-lg shadow-red-500/30'
              : 'bg-white/90 backdrop-blur text-neutral-600 hover:bg-white hover:text-red-500'
          )}
          aria-label="Add to wishlist"
        >
          <Heart className="w-4 h-4" fill={wishlisted ? 'currentColor' : 'none'} />
        </button>

        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          <span className={cn('badge', condBadge.color)}>{condBadge.label}</span>
          {listingBadge()}
        </div>
      </div>

      <div className="p-3 sm:p-4 space-y-2">
        <h3 className="font-semibold text-sm text-neutral-900 line-clamp-2 min-h-[2.5rem] group-hover:text-brand-600 transition-colors">
          {title}
        </h3>

        <div className="flex items-baseline gap-2">
          <span className="text-lg font-bold text-neutral-900">
            {listingType === 'free' ? 'Free' : formatPrice(price)}
          </span>
          {listingType === 'rent' && (
            <span className="text-xs text-neutral-500">/day</span>
          )}
        </div>

        <div className="flex items-center justify-between text-xs text-neutral-500 pt-1">
          <div className="flex items-center gap-1 min-w-0">
            {campusName && (
              <span className="truncate">📍 {campusName}</span>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0 ml-2">
            {sellerRating && parseFloat(String(sellerRating)) > 0 && (
              <>
                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                <span>{parseFloat(String(sellerRating)).toFixed(1)}</span>
              </>
            )}
            {isVerified && (
              <span title="Verified Seller">
                <CheckCircle2 className="w-3 h-3 text-fresh-500 ml-1" />
              </span>
            )}
          </div>
        </div>

        {sellerName && (
          <div className="text-xs text-neutral-500 truncate pt-0.5">
            by {sellerName}
          </div>
        )}
      </div>
    </Link>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="card overflow-hidden">
      <div className="aspect-square skeleton" />
      <div className="p-4 space-y-2">
        <div className="h-4 skeleton rounded w-3/4" />
        <div className="h-4 skeleton rounded w-1/2" />
        <div className="h-6 skeleton rounded w-1/3" />
      </div>
    </div>
  );
}
