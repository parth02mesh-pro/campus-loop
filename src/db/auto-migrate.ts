import { Pool } from 'pg';
import { is, getTableName, getTableColumns } from 'drizzle-orm';
import { PgTable } from 'drizzle-orm/pg-core';
import bcrypt from 'bcryptjs';
import * as schema from './schema';

const ENUMS: Record<string, string[]> = {
  user_role: ['user', 'admin'],
  product_condition: ['new', 'like_new', 'very_good', 'good', 'acceptable', 'used'],
  product_status: ['draft', 'pending', 'active', 'sold', 'rented', 'exchanged', 'archived', 'rejected'],
  order_status: [
    'pending_payment', 'confirmed', 'accepted', 'preparing', 'ready_pickup',
    'shipped', 'delivered', 'completed', 'cancelled', 'refunded', 'disputed'
  ],
  rental_status: ['pending', 'active', 'completed', 'cancelled', 'overdue'],
  exchange_status: ['pending', 'accepted', 'rejected', 'completed', 'cancelled'],
  payment_status: ['pending', 'completed', 'failed', 'refunded'],
  listing_type: ['sell', 'rent', 'exchange', 'free'],
};

// Dependency order for table creation if tables are completely missing
const TABLE_ORDER = [
  'institutions',
  'campuses',
  'departments',
  'courses',
  'categories',
  'subcategories',
  'users',
  'user_profiles',
  'addresses',
  'products',
  'product_images',
  'carts',
  'cart_items',
  'orders',
  'order_items',
  'payments',
  'rentals',
  'exchange_requests',
  'wishlists',
  'wishlist_items',
  'conversations',
  'messages',
  'notifications',
  'reviews',
  'reports',
  'coupons',
  'email_campaigns',
  'email_recipients',
  'audit_logs',
  'otp_verifications',
];

function getColumnSqlDefinition(col: any): string {
  const type = col.getSQLType();
  let clause = `"${col.name}" ${type}`;

  if (col.primary) {
    clause += ' PRIMARY KEY';
  }

  if (col.name === 'id' && type === 'uuid') {
    clause += ' DEFAULT gen_random_uuid()';
  } else if (typeof col.default === 'boolean' || typeof col.default === 'number') {
    clause += ` DEFAULT ${col.default}`;
  } else if (typeof col.default === 'string') {
    clause += ` DEFAULT '${col.default.replace(/'/g, "''")}'`;
  } else if (col.hasDefault && type.includes('timestamp')) {
    clause += ' DEFAULT now()';
  }

  return clause;
}

function getColumnAddClause(col: any): string {
  const type = col.getSQLType();
  let clause = `ADD COLUMN IF NOT EXISTS "${col.name}" ${type}`;

  if (col.name === 'id' && type === 'uuid') {
    clause += ' DEFAULT gen_random_uuid()';
  } else if (typeof col.default === 'boolean' || typeof col.default === 'number') {
    clause += ` DEFAULT ${col.default}`;
  } else if (typeof col.default === 'string') {
    clause += ` DEFAULT '${col.default.replace(/'/g, "''")}'`;
  } else if (col.hasDefault && type.includes('timestamp')) {
    clause += ' DEFAULT now()';
  }

  return clause;
}

let migrationPromise: Promise<void> | null = null;

export async function ensureDatabaseSchema(pool: Pool): Promise<void> {
  if (migrationPromise) {
    return migrationPromise;
  }

  migrationPromise = (async () => {
    try {
      console.log('🔄 [Auto-Migrate] Verifying database schema & column integrity...');

      // 1. Create all PostgreSQL enums in a single batched query
      const enumSqlBatch: string[] = [];
      for (const [enumName, values] of Object.entries(ENUMS)) {
        const valList = values.map((v) => `'${v}'`).join(', ');
        enumSqlBatch.push(`
          DO $$ BEGIN
            CREATE TYPE "${enumName}" AS ENUM (${valList});
          EXCEPTION
            WHEN duplicate_object THEN null;
          END $$;
        `);
      }
      await pool.query(enumSqlBatch.join('\n'));

      // 2. Fetch existing tables in public schema
      const tablesRes = await pool.query<{ table_name: string }>(
        `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';`
      );
      const existingTables = new Set(tablesRes.rows.map((r) => r.table_name));

      // 3. Fetch existing columns in public schema
      const colsRes = await pool.query<{ table_name: string; column_name: string }>(
        `SELECT table_name, column_name FROM information_schema.columns WHERE table_schema = 'public';`
      );
      const existingColumns: Record<string, Set<string>> = {};
      for (const row of colsRes.rows) {
        if (!existingColumns[row.table_name]) {
          existingColumns[row.table_name] = new Set();
        }
        existingColumns[row.table_name].add(row.column_name);
      }

      // Map schema PgTable objects by table name
      const schemaTables: Record<string, PgTable> = {};
      for (const value of Object.values(schema)) {
        if (is(value, PgTable)) {
          schemaTables[getTableName(value)] = value;
        }
      }

      // 4. Create missing tables according to dependency order
      const allTableNames = Array.from(new Set([...TABLE_ORDER, ...Object.keys(schemaTables)]));

      for (const tableName of allTableNames) {
        const tableObj = schemaTables[tableName];
        if (!tableObj) continue;

        const tableCols = getTableColumns(tableObj);

        if (!existingTables.has(tableName)) {
          console.log(`[Auto-Migrate] Table "${tableName}" does not exist. Creating...`);
          const colDefs = Object.values(tableCols).map(getColumnSqlDefinition);
          await pool.query(`
            CREATE TABLE IF NOT EXISTS "${tableName}" (
              ${colDefs.join(',\n              ')}
            );
          `);
          existingTables.add(tableName);
          existingColumns[tableName] = new Set(Object.values(tableCols).map((c) => c.name));
          console.log(`[Auto-Migrate] Table "${tableName}" created successfully.`);
        } else {
          // 5. Table exists: check every column and auto-migrate missing columns
          const existingColSet = existingColumns[tableName] || new Set();
          for (const col of Object.values(tableCols)) {
            if (!existingColSet.has(col.name)) {
              console.log(`[Auto-Migrate] Auto-migrating new column "${col.name}" on table "${tableName}"...`);
              const addClause = getColumnAddClause(col);
              await pool.query(`ALTER TABLE "${tableName}" ${addClause};`);
              existingColSet.add(col.name);
              console.log(`[Auto-Migrate] Added column "${col.name}" to "${tableName}".`);
            }
          }
        }
      }

      // 6. Ensure Master Admin Account exists
      const adminPasswordHash = await bcrypt.hash('admin@123', 10);
      const adminCheck = await pool.query<{ id: string }>(
        `SELECT id FROM "users" WHERE "email" = 'admin@gmail.com' LIMIT 1;`
      );

      let adminId = adminCheck.rows[0]?.id;
      if (!adminId) {
        console.log('[Auto-Migrate] Seeding master admin account (admin@gmail.com)...');
        const insertAdmin = await pool.query<{ id: string }>(`
          INSERT INTO "users" ("email", "phone", "password_hash", "role", "is_email_verified", "is_phone_verified", "is_active")
          VALUES ('admin@gmail.com', '9999999999', '${adminPasswordHash}', 'admin', true, true, true)
          RETURNING id;
        `);
        adminId = insertAdmin.rows[0]?.id;

        if (adminId) {
          await pool.query(`
            INSERT INTO "user_profiles" ("user_id", "full_name", "bio")
            VALUES ('${adminId}', 'Super Admin', 'Campus Loop Administrator')
            ON CONFLICT ("user_id") DO NOTHING;
          `);
        }
        console.log('[Auto-Migrate] Master admin account ready.');
      } else {
        await pool.query(`
          UPDATE "users"
          SET "role" = 'admin', "is_active" = true, "password_hash" = '${adminPasswordHash}'
          WHERE "id" = '${adminId}';
        `);
      }

      // 7. Ensure Baseline Categories (if table is empty)
      const catCount = await pool.query<{ count: string }>(`SELECT count(*) FROM "categories";`);
      if (parseInt(catCount.rows[0]?.count || '0', 10) === 0) {
        console.log('[Auto-Migrate] Seeding default categories...');
        const baseCategories = [
          { name: 'Books & Notes', slug: 'books', icon: '📚', desc: 'Textbooks, exam prep, novels, notes', sort: 1 },
          { name: 'Stationery', slug: 'stationery', icon: '✏️', desc: 'Notebooks, pens, drafters, geometry kits', sort: 2 },
          { name: 'Electronics', slug: 'electronics', icon: '💻', desc: 'Laptops, calculators, chargers, gadgets', sort: 3 },
          { name: 'Student Essentials', slug: 'essentials', icon: '🎒', desc: 'Backpacks, mattresses, kettles, bottles', sort: 4 },
          { name: 'Rent', slug: 'rent', icon: '🔄', desc: 'Short-term rentals for campus life', sort: 5 },
          { name: 'Exchange', slug: 'exchange', icon: '♻️', desc: 'Swap textbooks or gear with peers', sort: 6 },
          { name: 'Free', slug: 'free', icon: '🎁', desc: 'Giveaways and free items on campus', sort: 7 },
        ];

        for (const cat of baseCategories) {
          await pool.query(`
            INSERT INTO "categories" ("name", "slug", "icon", "description", "is_active", "sort_order")
            VALUES ('${cat.name}', '${cat.slug}', '${cat.icon}', '${cat.desc}', true, ${cat.sort})
            ON CONFLICT ("slug") DO NOTHING;
          `);
        }
      }

      // 8. Ensure Baseline Institutions & Campuses
      const campusCount = await pool.query<{ count: string }>(`SELECT count(*) FROM "campuses";`);
      if (parseInt(campusCount.rows[0]?.count || '0', 10) <= 1) {
        console.log('[Auto-Migrate] Seeding premier campuses...');
        const campusesToSeed = [
          { name: 'IIT Delhi Main Campus', inst: 'IIT Delhi', city: 'New Delhi', state: 'Delhi' },
          { name: 'NIT Trichy Main Campus', inst: 'NIT Trichy', city: 'Tiruchirappalli', state: 'Tamil Nadu' },
          { name: 'BITS Pilani Main Campus', inst: 'BITS Pilani', city: 'Pilani', state: 'Rajasthan' },
          { name: 'Delhi University (North Campus)', inst: 'Delhi University', city: 'New Delhi', state: 'Delhi' },
          { name: 'IIT Bombay Main Campus', inst: 'IIT Bombay', city: 'Mumbai', state: 'Maharashtra' },
          { name: 'VIT Vellore Main Campus', inst: 'VIT University', city: 'Vellore', state: 'Tamil Nadu' },
          { name: 'DPS R.K. Puram', inst: 'Delhi Public School', city: 'New Delhi', state: 'Delhi' },
        ];

        for (const c of campusesToSeed) {
          const instRes = await pool.query<{ id: string }>(`
            INSERT INTO "institutions" ("name", "type", "city", "state")
            VALUES ('${c.inst}', 'university', '${c.city}', '${c.state}')
            ON CONFLICT DO NOTHING
            RETURNING id;
          `);
          let instId = instRes.rows[0]?.id;
          if (!instId) {
            const existing = await pool.query<{ id: string }>(`SELECT id FROM "institutions" WHERE "name" = '${c.inst}' LIMIT 1;`);
            instId = existing.rows[0]?.id;
          }
          if (instId) {
            await pool.query(`
              INSERT INTO "campuses" ("institution_id", "name", "city", "state", "is_active", "is_verified")
              VALUES ('${instId}', '${c.name}', '${c.city}', '${c.state}', true, true)
              ON CONFLICT DO NOTHING;
            `);
          }
        }
      }


      console.log('✅ [Auto-Migrate] Database schema verified and in sync!');
    } catch (err) {
      console.error('❌ [Auto-Migrate] Migration error:', err);
      migrationPromise = null;
      throw err;
    }
  })();

  return migrationPromise;
}
