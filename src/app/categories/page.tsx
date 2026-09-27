'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/categories')
      .then((r) => r.json())
      .then((res) => setCategories(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const gradients = [
    'from-orange-100 to-orange-50',
    'from-yellow-100 to-yellow-50',
    'from-blue-100 to-blue-50',
    'from-purple-100 to-purple-50',
    'from-cyan-100 to-cyan-50',
    'from-emerald-100 to-emerald-50',
    'from-pink-100 to-pink-50',
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-3xl font-bold mb-2">All Categories</h1>
      <p className="text-neutral-600 mb-8">Browse through our diverse range of campus essentials</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="card p-6">
                <div className="skeleton h-16 w-16 rounded-xl mb-4" />
                <div className="skeleton h-6 w-3/4 mb-2" />
                <div className="skeleton h-4 w-1/2" />
              </div>
            ))
          : categories.map((cat, i) => (
              <Link
                key={cat.id}
                href={`/explore?category=${cat.slug}`}
                className={`card p-6 bg-gradient-to-br ${gradients[i % gradients.length]} hover:scale-[1.02] transition-transform group`}
              >
                <div className="text-5xl mb-4">{cat.icon}</div>
                <h3 className="text-xl font-bold mb-2">{cat.name}</h3>
                <p className="text-sm text-neutral-600 mb-4">{cat.description}</p>
                <div className="flex items-center gap-2 text-sm font-medium text-brand-600 group-hover:gap-3 transition-all">
                  Explore <ArrowRight className="w-4 h-4" />
                </div>
                {cat.subcategories && cat.subcategories.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-white/50">
                    <div className="flex flex-wrap gap-2">
                      {cat.subcategories.slice(0, 4).map((sub: any) => (
                        <span key={sub.id} className="text-xs bg-white/70 px-2 py-1 rounded-full">
                          {sub.name}
                        </span>
                      ))}
                      {cat.subcategories.length > 4 && (
                        <span className="text-xs bg-white/70 px-2 py-1 rounded-full">
                          +{cat.subcategories.length - 4} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </Link>
            ))}
      </div>
    </div>
  );
}
