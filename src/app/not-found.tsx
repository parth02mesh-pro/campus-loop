import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center">
        <div className="text-9xl font-bold bg-gradient-to-br from-brand-600 to-electric-500 bg-clip-text text-transparent">404</div>
        <h1 className="text-3xl font-bold mt-4 mb-2">Lost on campus?</h1>
        <p className="text-neutral-600 mb-8">This page doesn't exist in our marketplace</p>
        <div className="flex items-center justify-center gap-3">
          <Link href="/" className="btn btn-primary btn-md">Go Home</Link>
          <Link href="/explore" className="btn btn-secondary btn-md">Explore</Link>
        </div>
      </div>
    </div>
  );
}
