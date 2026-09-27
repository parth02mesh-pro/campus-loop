import { NextRequest } from 'next/server';
import { db } from '@/db';
import { products, productImages, users, userProfiles, campuses, categories } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { successResponse, errorResponse, withAuth } from '@/lib/api';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, id))
      .limit(1);

    if (!product) return errorResponse('Product not found', 404);

    return successResponse(product);
  } catch (error: any) {
    return errorResponse(error?.message || 'Failed to fetch product', 500);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(request, async (user) => {
    try {
      const { id } = await params;
      const body = await request.json();
      const { isAvailable, status } = body;

      const [existing] = await db
        .select()
        .from(products)
        .where(eq(products.id, id))
        .limit(1);

      if (!existing) return errorResponse('Product not found', 404);

      // Verify permission: only seller or admin can update product
      if (existing.sellerId !== user.userId && user.role !== 'admin') {
        return errorResponse('You are not authorized to update this listing', 403);
      }

      const updates: any = { updatedAt: new Date() };

      if (typeof isAvailable === 'boolean') {
        updates.isAvailable = isAvailable;
        if (!isAvailable && (!status || status === 'active')) {
          updates.status = 'sold';
        } else if (isAvailable && (!status || status === 'sold' || status === 'archived')) {
          updates.status = 'active';
        }
      }

      if (status) {
        updates.status = status;
        if (status === 'sold' || status === 'archived' || status === 'rejected') {
          updates.isAvailable = false;
        } else if (status === 'active') {
          updates.isAvailable = true;
        }
      }

      const [updated] = await db
        .update(products)
        .set(updates)
        .where(eq(products.id, id))
        .returning();

      return successResponse(updated);
    } catch (error: any) {
      console.error('Update product error:', error);
      return errorResponse(error?.message || 'Failed to update product', 500);
    }
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(request, async (user) => {
    try {
      const { id } = await params;
      const [existing] = await db
        .select()
        .from(products)
        .where(eq(products.id, id))
        .limit(1);

      if (!existing) return errorResponse('Product not found', 404);

      if (existing.sellerId !== user.userId && user.role !== 'admin') {
        return errorResponse('Not authorized', 403);
      }

      await db.delete(products).where(eq(products.id, id));
      return successResponse({ success: true, message: 'Product removed' });
    } catch (error: any) {
      return errorResponse(error?.message || 'Failed to delete product', 500);
    }
  });
}
