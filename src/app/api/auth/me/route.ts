import { NextRequest } from 'next/server';
import { db } from '@/db';
import { users, userProfiles, campuses, courses } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { successResponse, errorResponse, getSessionUser } from '@/lib/api';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionUser(request);
    if (!session) {
      return errorResponse('Unauthorized', 401);
    }

    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, session.userId))
        .limit(1);

      if (user && user.isActive) {
        const [profile] = await db
          .select({
            id: userProfiles.id,
            fullName: userProfiles.fullName,
            avatarUrl: userProfiles.avatarUrl,
            bio: userProfiles.bio,
            campusName: campuses.name,
            courseName: courses.name,
            rating: userProfiles.rating,
            totalRatings: userProfiles.totalRatings,
            productsSold: userProfiles.productsSold,
            productsBought: userProfiles.productsBought,
            year: userProfiles.year,
            semester: userProfiles.semester,
          })
          .from(userProfiles)
          .leftJoin(campuses, eq(userProfiles.campusId, campuses.id))
          .leftJoin(courses, eq(userProfiles.courseId, courses.id))
          .where(eq(userProfiles.userId, user.id))
          .limit(1);

        return successResponse({
          id: user.id,
          email: user.email,
          phone: user.phone,
          role: user.role,
          isEmailVerified: user.isEmailVerified,
          isPhoneVerified: user.isPhoneVerified,
          profile: profile || null,
        });
      }
    } catch (dbErr) {
      console.warn('Me DB fetch failed, returning session user:', (dbErr as any)?.message);
    }

    // Return session user directly if DB is offline or not yet initialized
    return successResponse({
      id: session.userId,
      email: session.email,
      phone: null,
      role: session.role,
      isEmailVerified: true,
      isPhoneVerified: false,
      profile: {
        fullName: session.role === 'admin' ? 'Super Admin' : session.email.split('@')[0],
        avatarUrl: null,
        bio: session.role === 'admin' ? 'Platform Administrator' : null,
      },
    });
  } catch (error) {
    console.error('Me error:', error);
    return errorResponse('Failed to fetch user', 500);
  }
}
