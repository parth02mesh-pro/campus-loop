import { notFound } from 'next/navigation';
import { db } from '@/db';
import { products, productImages, users, userProfiles, campuses, categories, subcategories } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { ProductDetailClient } from './ProductDetailClient';

export const dynamic = 'force-dynamic';

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [product] = await db
    .select()
    .from(products)
    .where(eq(products.id, id))
    .limit(1);

  if (!product) notFound();

  // Increment view count
  await db
    .update(products)
    .set({ viewCount: (product.viewCount || 0) + 1 })
    .where(eq(products.id, id));

  const images = await db
    .select()
    .from(productImages)
    .where(eq(productImages.productId, id));

  const sortedImages = images.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

  const [seller] = await db
    .select({
      id: users.id,
      profile: userProfiles,
    })
    .from(users)
    .leftJoin(userProfiles, eq(users.id, userProfiles.userId))
    .where(eq(users.id, product.sellerId))
    .limit(1);

  const [campus] = product.campusId
    ? await db.select().from(campuses).where(eq(campuses.id, product.campusId)).limit(1)
    : [null];

  const [category] = await db
    .select()
    .from(categories)
    .where(eq(categories.id, product.categoryId))
    .limit(1);

  const [subcategory] = product.subcategoryId
    ? await db.select().from(subcategories).where(eq(subcategories.id, product.subcategoryId)).limit(1)
    : [null];

  return (
    <ProductDetailClient
      product={{ ...product }}
      images={sortedImages}
      seller={seller as any}
      campus={campus as any}
      category={category as any}
      subcategory={subcategory as any}
    />
  );
}
