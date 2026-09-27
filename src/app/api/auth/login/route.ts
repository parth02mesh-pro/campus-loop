import { NextRequest } from 'next/server';
import { db } from '@/db';
import { users, userProfiles } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { verifyPassword, hashPassword, createToken } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/api';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return errorResponse('Email and password are required', 400);
    }

    const cleanEmail = email.toLowerCase().trim();

    // Special check for requested master admin credentials:
    // admin email: admin@gmail.com, password: admin@123
    const isAdminCredentials = cleanEmail === 'admin@gmail.com' && password === 'admin@123';

    try {
      // 1. Try fetching user from database
      let [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, cleanEmail))
        .limit(1);

      // If logging in as admin and admin does not exist in DB yet, auto-create it
      if (!user && isAdminCredentials) {
        const passwordHash = await hashPassword('admin@123');
        const [newAdmin] = await db
          .insert(users)
          .values({
            email: 'admin@gmail.com',
            passwordHash,
            role: 'admin',
            isEmailVerified: true,
            isPhoneVerified: true,
            isActive: true,
          })
          .returning();

        await db.insert(userProfiles).values({
          userId: newAdmin.id,
          fullName: 'Super Admin',
          bio: 'Campus Loop Platform Administrator',
        });

        user = newAdmin;
      }

      if (user) {
        if (!user.isActive) {
          return errorResponse('Account is suspended', 403);
        }

        const valid = isAdminCredentials || (await verifyPassword(password, user.passwordHash));
        if (!valid) {
          return errorResponse('Invalid email or password', 401);
        }

        const token = await createToken({
          userId: user.id,
          email: user.email,
          role: user.role,
        });

        const cookieStore = await cookies();
        cookieStore.set('cl_session', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 7,
          path: '/',
        });

        const [profile] = await db
          .select()
          .from(userProfiles)
          .where(eq(userProfiles.userId, user.id))
          .limit(1);

        return successResponse({
          user: {
            id: user.id,
            email: user.email,
            role: user.role,
            profile: {
              fullName: profile?.fullName || (user.role === 'admin' ? 'Admin' : 'User'),
              avatarUrl: profile?.avatarUrl || null,
              rating: profile?.rating || '5.0',
            },
          },
          token,
        });
      }

      return errorResponse('Invalid email or password', 401);
    } catch (error: any) {
      console.error('Login error:', error);
      return errorResponse('Invalid email or password', 401);
    }
  } catch (error: any) {
    console.error('Login error:', error);
    return errorResponse('Login failed', 500);
  }
}
