import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, type JWTPayload } from './auth';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export function successResponse<T>(data: T, status = 200): NextResponse<ApiResponse<T>> {
  return NextResponse.json({ success: true, data }, { status });
}

export function errorResponse(error: string, status = 400): NextResponse<ApiResponse> {
  return NextResponse.json({ success: false, error }, { status });
}

export async function getSessionUser(request: NextRequest): Promise<JWTPayload | null> {
  const authHeader = request.headers.get('authorization');
  const tokenFromHeader = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const tokenFromCookie = request.cookies.get('cl_session')?.value;
  const token = tokenFromHeader || tokenFromCookie;

  if (!token) return null;

  const payload = await verifyToken(token);
  return payload;
}

export async function requireAuth(request: NextRequest): Promise<JWTPayload> {
  const user = await getSessionUser(request);
  if (!user) {
    throw new Error('Unauthorized');
  }
  return user;
}

export async function requireAdmin(request: NextRequest): Promise<JWTPayload> {
  const user = await requireAuth(request);
  if (user.role !== 'admin') {
    throw new Error('Forbidden');
  }
  return user;
}

export async function withAuth<T>(
  request: NextRequest,
  handler: (user: JWTPayload) => Promise<NextResponse<T>>
): Promise<NextResponse> {
  try {
    const user = await requireAuth(request);
    return await handler(user);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Authentication required';
    if (message === 'Unauthorized') {
      return errorResponse('Unauthorized', 401);
    }
    if (message === 'Forbidden') {
      return errorResponse('Forbidden', 403);
    }
    return errorResponse(message, 500);
  }
}

export async function withAdmin<T>(
  request: NextRequest,
  handler: (user: JWTPayload) => Promise<NextResponse<T>>
): Promise<NextResponse> {
  try {
    const user = await requireAdmin(request);
    return await handler(user);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Authentication required';
    if (message === 'Unauthorized') {
      return errorResponse('Unauthorized', 401);
    }
    if (message === 'Forbidden') {
      return errorResponse('Forbidden - Admin access required', 403);
    }
    return errorResponse(message, 500);
  }
}

export async function getUserById(userId: string) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return user;
}

export function paginate(page: number | string = 1, limit: number | string = 20) {
  const p = Math.max(1, parseInt(String(page), 10) || 1);
  const l = Math.min(100, Math.max(1, parseInt(String(limit), 10) || 20));
  return { offset: (p - 1) * l, limit: l, page: p };
}
