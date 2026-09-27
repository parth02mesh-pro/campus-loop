import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { ensureDatabaseSchema } from "./auto-migrate";
import * as schema from "./schema";

const hasRealDbUrl = Boolean(process.env.DATABASE_URL && process.env.DATABASE_URL.trim().length > 0);
const databaseUrl = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/postgres";

if (!hasRealDbUrl) {
  // Graceful warning during build time instead of hard crash
  console.warn("⚠️ Warning: DATABASE_URL is not set. Ensure DATABASE_URL is added to your environment variables for runtime queries.");
}

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
  __arenaDatabaseUrl?: string;
  __arenaAutoMigratePromise?: Promise<void>;
};

// If DATABASE_URL changed, dispose the old pool
if (globalForDb.__arenaDatabaseUrl !== databaseUrl) {
  if (globalForDb.__arenaNextJsPostgresqlPool) {
    globalForDb.__arenaNextJsPostgresqlPool.end().catch(() => {});
  }
  globalForDb.__arenaNextJsPostgresqlPool = undefined;
  globalForDb.__arenaAutoMigratePromise = undefined;
  globalForDb.__arenaDatabaseUrl = databaseUrl;
}

export const pool =
  globalForDb.__arenaNextJsPostgresqlPool ??
  new Pool({
    connectionString: databaseUrl,
    ssl:
      databaseUrl.includes("neon.tech") ||
      databaseUrl.includes("sslmode=require") ||
      databaseUrl.includes("railway.app") ||
      databaseUrl.includes("supabase.co")
        ? { rejectUnauthorized: false }
        : undefined,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__arenaNextJsPostgresqlPool = pool;
}

// Automatically initialize schema and auto-migrate any new columns on database connection only if real DATABASE_URL is present
if (!globalForDb.__arenaAutoMigratePromise && hasRealDbUrl) {
  globalForDb.__arenaAutoMigratePromise = ensureDatabaseSchema(pool).catch((err) => {
    console.error("Auto-migration initialization error:", err);
  });
}

export { ensureDatabaseSchema };
export const db = drizzle(pool, { schema });
