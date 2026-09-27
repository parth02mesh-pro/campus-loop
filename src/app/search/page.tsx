'use client';

import { Suspense, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Search } from 'lucide-react';

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/explore?q=${encodeURIComponent(query)}`);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
      <h1 className="text-3xl font-bold mb-8">Search Campus Loop</h1>
      <form onSubmit={handleSearch} className="mb-8">
        <div className="flex items-center gap-2 bg-white rounded-2xl border-2 border-neutral-200 focus-within:border-brand-500 px-4 py-3">
          <Search className="w-5 h-5 text-neutral-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="What are you looking for?"
            className="flex-1 bg-transparent outline-none"
            autoFocus
          />
          <button type="submit" className="btn btn-primary btn-md">Search</button>
        </div>
      </form>

      <div className="space-y-4">
        <h3 className="font-semibold text-neutral-700">Popular searches</h3>
        <div className="flex flex-wrap gap-2">
          {['Engineering books', 'Calculator', 'Laptop', 'Backpack', 'Hostel essentials', 'Medical books'].map((s) => (
            <button
              key={s}
              onClick={() => { setQuery(s); router.push(`/explore?q=${encodeURIComponent(s)}`); }}
              className="badge bg-neutral-100 text-neutral-700 px-3 py-1.5 hover:bg-brand-50 hover:text-brand-700 cursor-pointer"
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="max-w-3xl mx-auto px-4 py-16"><div className="h-8 w-48 skeleton rounded mb-4" /></div>}>
      <SearchContent />
    </Suspense>
  );
}
