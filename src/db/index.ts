import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { ensureDatabaseSchema } from "./auto-migrate";
import * as schema from "./schema";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required");
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
    ssl: databaseUrl.includes("neon.tech") || databaseUrl.includes("sslmode=require")
      ? { rejectUnauthorized: false }
      : undefined,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__arenaNextJsPostgresqlPool = pool;
}

// Automatically initialize schema and auto-migrate any new columns on database connection
if (!globalForDb.__arenaAutoMigratePromise) {
  globalForDb.__arenaAutoMigratePromise = ensureDatabaseSchema(pool).catch((err) => {
    console.error("Auto-migration initialization error:", err);
  });
}

export { ensureDatabaseSchema };
export const db = drizzle(pool, { schema });


