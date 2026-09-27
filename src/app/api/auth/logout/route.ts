import { successResponse } from '@/lib/api';
import { cookies } from 'next/headers';

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete('cl_session');
  return successResponse({ message: 'Logged out' });
}
