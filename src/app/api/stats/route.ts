import { db } from '@/db';
import { users, products, campuses } from '@/db/schema';
import { eq, count } from 'drizzle-orm';
import { successResponse } from '@/lib/api';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [usersCount] = await db
      .select({ count: count() })
      .from(users)
      .where(eq(users.isActive, true));

    const [productsCount] = await db
      .select({ count: count() })
      .from(products)
      .where(eq(products.status, 'active'));

    const [campusesCount] = await db
      .select({ count: count() })
      .from(campuses)
      .where(eq(campuses.isActive, true));

    return successResponse({
      users: usersCount?.count || 0,
      products: productsCount?.count || 0,
      campuses: campusesCount?.count || 0,
      deals: Math.floor((productsCount?.count || 0) * 0.7),
    });
  } catch (error) {
    console.error('Stats error:', error);
    return successResponse({ users: 0, products: 0, campuses: 0, deals: 0 });
  }
}
