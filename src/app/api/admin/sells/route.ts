import { NextRequest } from 'next/server';
import { db } from '@/db';
import { orders, users, userProfiles } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';
import { successResponse, errorResponse, withAdmin, paginate } from '@/lib/api';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  return withAdmin(request, async () => {
    try {
      const searchParams = request.nextUrl.searchParams;
      const { offset, limit } = paginate(searchParams.get('page') || undefined, searchParams.get('limit') || undefined);

      const allOrders = await db
        .select({
          id: orders.id,
          orderNumber: orders.orderNumber,
          status: orders.status,
          total: orders.total,
          amount: orders.total,
          createdAt: orders.createdAt,
          buyerName: userProfiles.fullName,
          buyerEmail: users.email,
        })
        .from(orders)
        .leftJoin(users, eq(orders.buyerId, users.id))
        .leftJoin(userProfiles, eq(users.id, userProfiles.userId))
        .orderBy(desc(orders.createdAt))
        .limit(limit)
        .offset(offset);

      return successResponse<any[]>(allOrders as any);
    } catch (error) {
      console.error('Admin sells error:', error);
      return successResponse<any[]>([]);
    }
  });
}
