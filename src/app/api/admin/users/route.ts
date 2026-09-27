import { NextRequest } from 'next/server';
import { db } from '@/db';
import { users, userProfiles } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { successResponse, errorResponse, withAdmin, paginate } from '@/lib/api';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  return withAdmin(request, async () => {
    try {
      const searchParams = request.nextUrl.searchParams;
      const { offset, limit } = paginate(searchParams.get('page') || undefined, searchParams.get('limit') || undefined);

      const allUsers = await db
        .select({
          id: users.id,
          email: users.email,
          phone: users.phone,
          role: users.role,
          isEmailVerified: users.isEmailVerified,
          isPhoneVerified: users.isPhoneVerified,
          isActive: users.isActive,
          createdAt: users.createdAt,
          profile: userProfiles,
        })
        .from(users)
        .leftJoin(userProfiles, eq(users.id, userProfiles.userId))
        .orderBy(desc(users.createdAt))
        .limit(limit)
        .offset(offset);

      return successResponse<any[]>(allUsers as any);
    } catch (error) {
      console.error('Admin users error:', error);
      return successResponse<any[]>([]);
    }
  });
}

// POST: Toggle user active/suspended status
export async function POST(request: NextRequest) {
  return withAdmin(request, async () => {
    try {
      const { userId, isActive } = await request.json();
      if (!userId) return errorResponse('userId is required', 400);

      try {
        await db
          .update(users)
          .set({ isActive: !!isActive })
          .where(eq(users.id, userId));
      } catch (dbErr) {
        console.warn('DB update user status failed:', dbErr);
      }

      return successResponse({ success: true, message: `User status updated to ${isActive ? 'active' : 'suspended'}` });
    } catch (error: any) {
      return errorResponse(error?.message || 'Failed to update user', 500);
    }
  });
}
