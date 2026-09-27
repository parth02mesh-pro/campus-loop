'use client';

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ProductCard, ProductCardSkeleton, type ProductCardProps } from '@/components/ProductCard';
import { Search, Filter, X } from 'lucide-react';
import { useEffect, useState } from 'react';

function ExploreContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [products, setProducts] = useState<ProductCardProps[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<any[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const q = searchParams.get('q') || '';
  const category = searchParams.get('category') || '';
  const listingType = searchParams.get('type') || '';
  const sort = searchParams.get('sort') || 'newest';

  useEffect(() => {
    fetch('/api/categories')
      .then((r) => r.json())
      .then((res) => setCategories(res.data || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (category) params.set('category', category);
    if (listingType) params.set('listingType', listingType);
    params.set('sort', sort);
    params.set('status', 'active');
    params.set('limit', '40');

    fetch(`/api/products?${params}`)
      .then((r) => r.json())
      .then((res) => {
        const items = (res.data?.items || []).map((p: any) => ({
          id: p.id,
          title: p.title,
          price: p.price,
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
  }, [q, category, listingType, sort]);

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`/explore?${params.toString()}`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold">Explore Campus Loop</h1>
          <p className="text-neutral-600 text-sm mt-1">
            {loading ? 'Loading...' : `${products.length} items found`}
            {q && ` for "${q}"`}
            {category && ` in ${category}`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const form = e.currentTarget as HTMLFormElement;
              const value = (form.elements.namedItem('q') as HTMLInputElement).value;
              updateFilter('q', value);
            }}
            className="flex items-center gap-2 bg-white rounded-xl border border-neutral-200 px-3 py-2 flex-1 sm:flex-initial"
          >
            <Search className="w-4 h-4 text-neutral-400" />
            <input
              name="q"
              defaultValue={q}
              placeholder="Search items..."
              className="bg-transparent outline-none flex-1 sm:w-48 text-sm"
            />
          </form>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn btn-secondary btn-md sm:hidden"
          >
            <Filter className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6">
        <aside className={`${showFilters ? 'block' : 'hidden'} lg:block space-y-4`}>
          <div className="card p-4">
            <h3 className="font-semibold mb-3 text-sm">Listing Type</h3>
            <div className="space-y-1">
              {[
                { label: 'All', value: '' },
                { label: '🛒 Buy', value: 'sell' },
                { label: '🔄 Rent', value: 'rent' },
                { label: '♻️ Exchange', value: 'exchange' },
                { label: '🎁 Free', value: 'free' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => updateFilter('type', opt.value)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    listingType === opt.value ? 'bg-brand-50 text-brand-700 font-medium' : 'hover:bg-neutral-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="card p-4">
            <h3 className="font-semibold mb-3 text-sm">Category</h3>
            <div className="space-y-1 max-h-60 overflow-y-auto">
              <button
                onClick={() => updateFilter('category', '')}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  !category ? 'bg-brand-50 text-brand-700 font-medium' : 'hover:bg-neutral-50'
                }`}
              >
                All Categories
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => updateFilter('category', cat.slug)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    category === cat.slug ? 'bg-brand-50 text-brand-700 font-medium' : 'hover:bg-neutral-50'
                  }`}
                >
                  {cat.icon} {cat.name}
                </button>
              ))}
            </div>
          </div>

          <div className="card p-4">
            <h3 className="font-semibold mb-3 text-sm">Sort By</h3>
            <select
              value={sort}
              onChange={(e) => updateFilter('sort', e.target.value)}
              className="input text-sm"
            >
              <option value="newest">Newest</option>
              <option value="price_asc">Price: Low → High</option>
              <option value="price_desc">Price: High → Low</option>
              <option value="popular">Popular</option>
            </select>
          </div>
        </aside>

        <div>
          {(q || category || listingType) && (
            <div className="flex flex-wrap gap-2 mb-4">
              {q && (
                <span className="badge bg-brand-50 text-brand-700 px-3 py-1">
                  Search: {q}
                  <button onClick={() => updateFilter('q', '')} className="ml-1">
                    <X className="w-3 h-3 inline" />
                  </button>
                </span>
              )}
              {category && (
                <span className="badge bg-electric-50 text-electric-700 px-3 py-1">
                  {category}
                  <button onClick={() => updateFilter('category', '')} className="ml-1">
                    <X className="w-3 h-3 inline" />
                  </button>
                </span>
              )}
              {listingType && (
                <span className="badge bg-fresh-50 text-fresh-700 px-3 py-1">
                  {listingType}
                  <button onClick={() => updateFilter('type', '')} className="ml-1">
                    <X className="w-3 h-3 inline" />
                  </button>
                </span>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {loading
              ? Array.from({ length: 12 }).map((_, i) => <ProductCardSkeleton key={i} />)
              : products.map((p) => <ProductCard key={p.id} {...p} />)}
          </div>

          {!loading && products.length === 0 && (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="font-semibold text-lg mb-2">No items found</h3>
              <p className="text-neutral-600 mb-6">Try adjusting your filters or search query</p>
              <button
                onClick={() => router.push('/explore')}
                className="btn btn-primary btn-md"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ExplorePage() {
  return (
    <Suspense fallback={
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="h-8 w-64 skeleton rounded mb-4" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 12 }).map((_, i) => <ProductCardSkeleton key={i} />)}
        </div>
      </div>
    }>
      <ExploreContent />
    </Suspense>
  );
}
