import { db } from '@/db';
import { categories, subcategories } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { successResponse, errorResponse } from '@/lib/api';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const allCategories = await db
      .select()
      .from(categories)
      .where(eq(categories.isActive, true))
      .orderBy(categories.sortOrder);

    // Get subcategories for each
    const enriched = await Promise.all(
      allCategories.map(async (cat) => {
        const subs = await db
          .select()
          .from(subcategories)
          .where(eq(subcategories.categoryId, cat.id));
        return { ...cat, subcategories: subs };
      })
    );

    return successResponse(enriched);
  } catch (error) {
    console.error('Categories DB query error:', (error as any)?.message);
    return errorResponse((error as any)?.message || 'Failed to fetch categories', 500);
  }
}


