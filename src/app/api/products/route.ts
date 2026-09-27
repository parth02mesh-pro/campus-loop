import { NextRequest } from 'next/server';
import { db } from '@/db';
import { products, productImages, users, userProfiles, campuses, categories } from '@/db/schema';
import { eq, desc, and, like, gte, lte, or, inArray } from 'drizzle-orm';
import { successResponse, errorResponse, paginate, withAuth } from '@/lib/api';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const { offset, limit } = paginate(searchParams.get('page') || undefined, searchParams.get('limit') || undefined);
  const status = searchParams.get('status') || 'active';
  const categorySlug = searchParams.get('category');
  const campusId = searchParams.get('campusId');
  const listingType = searchParams.get('listingType');
  const q = searchParams.get('q');
  const minPrice = searchParams.get('minPrice');
  const maxPrice = searchParams.get('maxPrice');
  const sort = searchParams.get('sort') || 'newest';

  try {
    const conditions: any[] = [eq(products.status, status as any)];

    if (listingType) conditions.push(eq(products.listingType, listingType as any));
    if (campusId) conditions.push(eq(products.campusId, campusId));
    if (minPrice) conditions.push(gte(products.price, minPrice));
    if (maxPrice) conditions.push(lte(products.price, maxPrice));

    let query = db
      .select({
        id: products.id,
        title: products.title,
        description: products.description,
        price: products.price,
        condition: products.condition,
        listingType: products.listingType,
        rentalPriceDaily: products.rentalPriceDaily,
        rentalPriceWeekly: products.rentalPriceWeekly,
        rentalPriceMonthly: products.rentalPriceMonthly,
        rentalDeposit: products.rentalDeposit,
        isAvailable: products.isAvailable,
        status: products.status,
        viewCount: products.viewCount,
        createdAt: products.createdAt,
        sellerId: products.sellerId,
        campusId: products.campusId,
        categoryId: products.categoryId,
        campus: campuses,
        category: categories,
        seller: users,
        sellerProfile: userProfiles,
      })
      .from(products)
      .leftJoin(campuses, eq(products.campusId, campuses.id))
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .leftJoin(users, eq(products.sellerId, users.id))
      .leftJoin(userProfiles, eq(users.id, userProfiles.userId));

    if (categorySlug) {
      conditions.push(eq(categories.slug, categorySlug));
    }

    if (q) {
      conditions.push(
        or(
          like(products.title, `%${q}%`),
          like(products.description, `%${q}%`)
        )
      );
    }

    const where = and(...conditions);

    let orderBy: any = desc(products.createdAt);
    if (sort === 'price_asc') orderBy = products.price;
    if (sort === 'price_desc') orderBy = desc(products.price);
    if (sort === 'popular') orderBy = desc(products.viewCount);

    const items = await query
      .where(where)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    const productIds = items.map((i) => i.id);
    const images = productIds.length > 0
      ? await db
          .select()
          .from(productImages)
          .where(inArray(productImages.productId, productIds as any))
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

    return successResponse({
      items: enriched,
      pagination: { page: Math.floor(offset / limit) + 1, limit, total: items.length },
    });
  } catch (error) {
    console.error('Products DB query error:', (error as any)?.message);
    return successResponse({
      items: [],
      pagination: { page: Math.floor(offset / limit) + 1, limit, total: 0 },
    });
  }
}

export async function POST(request: NextRequest) {
  return withAuth(request, async (user) => {
    try {
      const body = await request.json();
      const {
        title, description, categoryId, condition, listingType, price,
        campusId, brand, author, edition, course, department, semester,
        subcategoryId, rentalPriceDaily, rentalPriceWeekly, rentalPriceMonthly,
        rentalPriceSemester, rentalDeposit, images = [],
      } = body;

      if (!title || !description || !categoryId || !condition) {
        return errorResponse('Missing required fields', 400);
      }

      const [product] = await db
        .insert(products)
        .values({
          sellerId: user.userId,
          title: title.trim(),
          description: description.trim(),
          categoryId,
          subcategoryId: subcategoryId || null,
          campusId: campusId || null,
          condition,
          listingType: listingType || 'sell',
          price: price ? String(price) : null,
          brand: brand || null,
          author: author || null,
          edition: edition || null,
          course: course || null,
          department: department || null,
          semester: semester || null,
          rentalPriceDaily: rentalPriceDaily ? String(rentalPriceDaily) : null,
          rentalPriceWeekly: rentalPriceWeekly ? String(rentalPriceWeekly) : null,
          rentalPriceMonthly: rentalPriceMonthly ? String(rentalPriceMonthly) : null,
          rentalPriceSemester: rentalPriceSemester ? String(rentalPriceSemester) : null,
          rentalDeposit: rentalDeposit ? String(rentalDeposit) : null,
          status: 'active',
          isAvailable: true,
        } as any)
        .returning();

      // Store uploaded image URLs in database
      if (Array.isArray(images) && images.length > 0) {
        for (let i = 0; i < images.length; i++) {
          await db.insert(productImages).values({
            productId: product.id,
            url: images[i],
            sortOrder: i,
          });
        }
      }

      return successResponse(product, 201);
    } catch (error) {
      console.error('Products POST error:', error);
      return errorResponse('Failed to create product. Check database connection.', 500);
    }
  });
}
