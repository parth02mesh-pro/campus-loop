import { NextRequest } from 'next/server';
import { db } from '@/db';
import { users, userProfiles } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { hashPassword, createToken, isValidEmail, isValidPassword } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/api';
import { cookies } from 'next/headers';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, fullName, phone } = body;

    if (!email || !password) {
      return errorResponse('Email and password are required', 400);
    }

    if (!isValidEmail(email)) {
      return errorResponse('Invalid email format', 400);
    }

    const passwordCheck = isValidPassword(password);
    if (!passwordCheck.valid) {
      return errorResponse(passwordCheck.errors[0], 400);
    }

    const cleanEmail = email.toLowerCase().trim();
    // Check if user exists in database
    const [existing] = await db
      .select()
      .from(users)
      .where(eq(users.email, cleanEmail))
      .limit(1);

    if (existing) {
      return errorResponse('Email already registered', 400);
    }

    // Create user in database
    const passwordHash = await hashPassword(password);
    const [user] = await db
      .insert(users)
      .values({
        email: cleanEmail,
        phone: phone || null,
        passwordHash,
        role: 'user',
        isEmailVerified: false,
        isPhoneVerified: false,
      })
      .returning();

    // Create profile
    await db.insert(userProfiles).values({
      userId: user.id,
      fullName: fullName || cleanEmail.split('@')[0],
    });


    // Create JWT token
    const token = await createToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Set HTTP-only cookie
    const cookieStore = await cookies();
    cookieStore.set('cl_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return successResponse({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        profile: {
          fullName: fullName || cleanEmail.split('@')[0],
        },
      },
      token,
    }, 201);
  } catch (error) {
    console.error('Signup error:', error);
    return errorResponse('Failed to create account', 500);
  }
}
