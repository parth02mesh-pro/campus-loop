import { NextRequest } from 'next/server';
import { db } from '@/db';
import { campuses, institutions } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { successResponse, errorResponse } from '@/lib/api';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const allCampuses = await db
      .select({
        id: campuses.id,
        name: campuses.name,
        city: campuses.city,
        state: campuses.state,
        address: campuses.address,
        isActive: campuses.isActive,
        createdAt: campuses.createdAt,
        institutionId: campuses.institutionId,
        institutionName: institutions.name,
      })
      .from(campuses)
      .leftJoin(institutions, eq(campuses.institutionId, institutions.id))
      .orderBy(desc(campuses.createdAt));

    return successResponse(allCampuses);
  } catch (error) {
    console.error('Campuses GET error:', error);
    return successResponse([]);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, city, state, institutionName, address } = body;

    if (!name || !city) {
      return errorResponse('Campus name and city are required', 400);
    }

    // Check if institution exists or create one
    const instName = institutionName?.trim() || name.replace(/Main Campus|Campus/i, '').trim();
    const [existingInst] = await db
      .select()
      .from(institutions)
      .where(eq(institutions.name, instName))
      .limit(1);

    let institutionId = existingInst?.id;
    if (!institutionId) {
      const [newInst] = await db
        .insert(institutions)
        .values({
          name: instName,
          type: 'university',
          city,
          state: state || null,
        })
        .returning();
      institutionId = newInst.id;
    }

    const [newCampus] = await db
      .insert(campuses)
      .values({
        name: name.trim(),
        institutionId,
        city: city.trim(),
        state: state?.trim() || null,
        address: address?.trim() || null,
        isActive: true,
        isVerified: true,
      })
      .returning();

    return successResponse(newCampus, 201);
  } catch (error: any) {
    console.error('Campuses POST error:', error);
    return errorResponse(error?.message || 'Failed to create campus', 500);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return errorResponse('Campus ID is required', 400);

    await db.delete(campuses).where(eq(campuses.id, id));
    return successResponse({ success: true, message: 'Campus deleted successfully' });
  } catch (error: any) {
    console.error('Campuses DELETE error:', error);
    return errorResponse(error?.message || 'Failed to delete campus', 500);
  }
}
