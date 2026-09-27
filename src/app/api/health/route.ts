import { db } from "@/db";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await db.execute(sql`select 1`);
    return Response.json({ ok: true, status: 'connected' });
  } catch (err: any) {
    return Response.json({
      ok: false,
      status: 'error',
      error: err?.message || 'Database connection error',
    }, { status: 500 });
  }
}




