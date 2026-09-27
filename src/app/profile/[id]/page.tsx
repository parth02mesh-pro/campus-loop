import { notFound } from 'next/navigation';
import { db } from '@/db';
import { users, userProfiles, campuses, products, productImages } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import Link from 'next/link';
import { CheckCircle2, Star, MapPin, BookOpen, MessageCircle, Package, ArrowLeft } from 'lucide-react';
import { ProductCard, type ProductCardProps } from '@/components/ProductCard';

export const dynamic = 'force-dynamic';

export default async function PublicProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      role: users.role,
      isEmailVerified: users.isEmailVerified,
      createdAt: users.createdAt,
      profile: userProfiles,
    })
    .from(users)
    .leftJoin(userProfiles, eq(users.id, userProfiles.userId))
    .where(eq(users.id, id))
    .limit(1);

  if (!user) notFound();

  const [campus] = user.profile?.campusId
    ? await db.select().from(campuses).where(eq(campuses.id, user.profile.campusId)).limit(1)
    : [null];

  // Fetch active products by this seller
  const userProducts = await db
    .select({
      id: products.id,
      title: products.title,
      price: products.price,
      condition: products.condition,
      listingType: products.listingType,
      campusId: products.campusId,
      status: products.status,
    })
    .from(products)
    .where(and(eq(products.sellerId, id), eq(products.status, 'active')));

  const productsWithImages: ProductCardProps[] = await Promise.all(
    userProducts.map(async (p) => {
      const [img] = await db
        .select()
        .from(productImages)
        .where(eq(productImages.productId, p.id))
        .limit(1);

      return {
        id: p.id,
        title: p.title,
        price: p.price,
        condition: p.condition,
        campusName: campus?.name,
        sellerRating: user.profile?.rating,
        imageUrl: img?.url || null,
        listingType: p.listingType,
        isVerified: user.isEmailVerified,
      };
    })
  );

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <Link href="/explore" className="btn btn-ghost btn-sm gap-1.5 mb-6 text-neutral-600">
        <ArrowLeft className="w-4 h-4" /> Back to Explore
      </Link>

      <div className="card p-6 sm:p-8 mb-8 border border-neutral-200">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-brand-500 to-electric-500 flex items-center justify-center text-white text-3xl font-bold shrink-0 shadow-md">
            {user.profile?.fullName?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold">{user.profile?.fullName || 'Campus Student'}</h1>
              <span className="badge bg-fresh-100 text-fresh-700">
                <CheckCircle2 className="w-3 h-3" /> Verified Student
              </span>
            </div>
            <p className="text-neutral-500 text-sm mt-0.5">{user.email}</p>
            <div className="flex flex-wrap gap-4 mt-3 text-sm text-neutral-600">
              {campus?.name && (
                <span className="flex items-center gap-1 font-medium text-brand-700">
                  <MapPin className="w-4 h-4 text-brand-600" /> {campus.name}
                </span>
              )}
              {user.profile?.year && (
                <span>Year {user.profile.year}</span>
              )}
              {user.profile?.rating && parseFloat(user.profile.rating) > 0 && (
                <span className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  {parseFloat(user.profile.rating).toFixed(1)} rating
                </span>
              )}
            </div>
          </div>
          <Link
            href={`/messages?user=${user.id}`}
            className="btn btn-primary btn-md gap-1.5 shrink-0"
          >
            <MessageCircle className="w-4 h-4" /> Message Student
          </Link>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Package className="w-5 h-5 text-brand-600" />
            Listings by {user.profile?.fullName || 'this student'} ({productsWithImages.length})
          </h2>
        </div>

        {productsWithImages.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {productsWithImages.map((p) => (
              <ProductCard key={p.id} {...p} />
            ))}
          </div>
        ) : (
          <div className="card p-12 text-center text-neutral-400">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <h3 className="font-semibold text-neutral-700 mb-1">No active listings</h3>
            <p className="text-sm">This student does not currently have any active items for sale.</p>
          </div>
        )}
      </div>
    </div>
  );
}
