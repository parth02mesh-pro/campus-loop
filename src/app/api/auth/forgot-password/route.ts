import { NextRequest } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { hashPassword, isValidEmail, isValidPassword } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/api';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, newPassword } = body;

    if (!email) {
      return errorResponse('Email is required', 400);
    }

    if (!isValidEmail(email)) {
      return errorResponse('Invalid email format', 400);
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check if user exists in database
    const [user] = await db
      .select({ id: users.id, email: users.email })
      .from(users)
      .where(eq(users.email, cleanEmail))
      .limit(1);

    if (!user) {
      return errorResponse('No account found with this email', 404);
    }

    // If newPassword is provided, reset it directly
    if (newPassword) {
      const passwordCheck = isValidPassword(newPassword);
      if (!passwordCheck.valid) {
        return errorResponse(passwordCheck.errors[0], 400);
      }

      const passwordHash = await hashPassword(newPassword);
      await db
        .update(users)
        .set({
          passwordHash,
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id));

      return successResponse({
        message: 'Password reset successfully. You can now log in with your new password.',
      });
    }

    // Otherwise, confirm email exists and is eligible for reset
    return successResponse({
      message: 'Account verified. Please enter your new password.',
      verified: true,
      email: cleanEmail,
    });
  } catch (error: any) {
    console.error('Forgot password error:', error);
    return errorResponse(error?.message || 'Failed to process password reset', 500);
  }
}
