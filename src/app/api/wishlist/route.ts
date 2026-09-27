import { NextRequest } from 'next/server';
import { db } from '@/db';
import { wishlists, wishlistItems, products, productImages, campuses, userProfiles, users } from '@/db/schema';
import { eq, and, desc, inArray } from 'drizzle-orm';
import { successResponse, errorResponse, withAuth } from '@/lib/api';

export const dynamic = 'force-dynamic';

// GET all wishlisted products for logged in user
export async function GET(request: NextRequest) {
  return withAuth(request, async (user) => {
    try {
      // Find or create user wishlist
      let [wishlist] = await db
        .select()
        .from(wishlists)
        .where(eq(wishlists.userId, user.userId))
        .limit(1);

      if (!wishlist) {
        [wishlist] = await db
          .insert(wishlists)
          .values({ userId: user.userId })
          .returning();
      }

      // Fetch items
      const items = await db
        .select({
          wishlistItemId: wishlistItems.id,
          savedAt: wishlistItems.createdAt,
          id: products.id,
          title: products.title,
          description: products.description,
          price: products.price,
          condition: products.condition,
          listingType: products.listingType,
          rentalPriceDaily: products.rentalPriceDaily,
          isAvailable: products.isAvailable,
          status: products.status,
          campus: campuses,
          seller: users,
          sellerProfile: userProfiles,
        })
        .from(wishlistItems)
        .innerJoin(products, eq(wishlistItems.productId, products.id))
        .leftJoin(campuses, eq(products.campusId, campuses.id))
        .leftJoin(users, eq(products.sellerId, users.id))
        .leftJoin(userProfiles, eq(users.id, userProfiles.userId))
        .where(eq(wishlistItems.wishlistId, wishlist.id))
        .orderBy(desc(wishlistItems.createdAt));

      // Fetch images for products
      const productIds = items.map((i) => i.id);
      const images = productIds.length > 0
        ? await db
            .select()
            .from(productImages)
            .where(inArray(productImages.productId, productIds))
        : [];

      const imagesByProduct = images.reduce<Record<string, typeof images>>((acc, img) => {
        if (!acc[img.productId]) acc[img.productId] = [];
        acc[img.productId].push(img);
        return acc;
      }, {});

      const enriched = items.map((item) => ({
        ...item,
        images: (imagesByProduct[item.id] || []).sort((a: any, b: any) => (a.sortOrder || 0) - (b.sortOrder || 0)),
      }));

      return successResponse(enriched);
    } catch (error: any) {
      console.error('Wishlist GET error:', error);
      return errorResponse('Failed to fetch wishlist', 500);
    }
  });
}

// POST toggle item in wishlist (add/remove)
export async function POST(request: NextRequest) {
  return withAuth(request, async (user) => {
    try {
      const body = await request.json();
      const { productId } = body;

      if (!productId) {
        return errorResponse('Product ID is required', 400);
      }

      // Find or create wishlist
      let [wishlist] = await db
        .select()
        .from(wishlists)
        .where(eq(wishlists.userId, user.userId))
        .limit(1);

      if (!wishlist) {
        [wishlist] = await db
          .insert(wishlists)
          .values({ userId: user.userId })
          .returning();
      }

      // Check if already in wishlist
      const [existing] = await db
        .select()
        .from(wishlistItems)
        .where(and(
          eq(wishlistItems.wishlistId, wishlist.id),
          eq(wishlistItems.productId, productId)
        ))
        .limit(1);

      if (existing) {
        await db
          .delete(wishlistItems)
          .where(eq(wishlistItems.id, existing.id));

        return successResponse({ wishlisted: false, message: 'Removed from wishlist' });
      } else {
        await db
          .insert(wishlistItems)
          .values({
            wishlistId: wishlist.id,
            productId,
          });

        return successResponse({ wishlisted: true, message: 'Added to wishlist' });
      }
    } catch (error: any) {
      console.error('Wishlist POST error:', error);
      return errorResponse('Failed to update wishlist', 500);
    }
  });
}
