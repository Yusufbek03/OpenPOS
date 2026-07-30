import type { VercelRequest, VercelResponse } from '@vercel/node';
import { json, error, corsPreflight } from './lib/supabase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') return corsPreflight(res, req.headers.origin);
  if (req.method !== 'POST') return error(res, 'POST only', 405, req.headers.origin);
  const origin = req.headers.origin;

  const secret = req.headers['x-seed-secret'];
  if (secret !== 'openpos-seed-2026') return error(res, 'Forbidden', 403, origin);

  const poolerUrl = process.env.DATABASE_URL;
  if (!poolerUrl) return error(res, 'DATABASE_URL not set', 500, origin);

  const { Client } = await import('pg');
  const client = new Client({ connectionString: poolerUrl, ssl: { rejectUnauthorized: false } });

  try {
    await client.connect();
    const results: Record<string, string> = {};

    const sql = `
      DO $$ DECLARE r RECORD;
      BEGIN
        FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
          EXECUTE 'ALTER TABLE IF EXISTS ' || quote_ident(r.tablename) || ' DISABLE ROW LEVEL SECURITY';
        END LOOP;
        FOR r IN (SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'public') LOOP
          EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON ' || quote_ident(r.schemaname) || '.' || quote_ident(r.tablename);
        END LOOP;
      END $$;

      GRANT USAGE ON SCHEMA public TO anon;
      GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
      GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;

      INSERT INTO roles (id, name, description, "createdAt", "updatedAt") VALUES
        ('a0000001-0000-0000-0000-000000000001', 'OWNER', 'Владелец системы', NOW(), NOW()),
        ('a0000001-0000-0000-0000-000000000002', 'ADMINISTRATOR', 'Администратор', NOW(), NOW()),
        ('a0000001-0000-0000-0000-000000000003', 'CASHIER', 'Кассир', NOW(), NOW()),
        ('a0000001-0000-0000-0000-000000000004', 'WAITER', 'Официант', NOW(), NOW()),
        ('a0000001-0000-0000-0000-000000000005', 'KITCHEN', 'Повар', NOW(), NOW())
      ON CONFLICT (name) DO NOTHING;

      INSERT INTO companies (id, name, inn, phone, "createdAt", "updatedAt") VALUES
        ('b0000001-0000-0000-0000-000000000001', 'OpenPOS Demo', '123456789', '+998901234567', NOW(), NOW())
      ON CONFLICT DO NOTHING;

      INSERT INTO branches (id, name, address, "companyId", phone, "isActive", "createdAt", "updatedAt") VALUES
        ('c0000001-0000-0000-0000-000000000001', 'Главный филиал', 'Ташкент', 'b0000001-0000-0000-0000-000000000001', '+998901234567', true, NOW(), NOW())
      ON CONFLICT DO NOTHING;

      INSERT INTO users (id, "fullName", username, "passwordHash", "isActive", "roleId", "branchId", "createdAt", "updatedAt") VALUES
        ('d0000001-0000-0000-0000-000000000001', 'Администратор', 'admin', '$2a$12$sKWWbMAnOpUr8oSsZmqg8.pk0fVT8u3cvz.DrBrcHzVNjhuKNJIsq', true, 'a0000001-0000-0000-0000-000000000001', 'c0000001-0000-0000-0000-000000000001', NOW(), NOW())
      ON CONFLICT DO NOTHING;

      INSERT INTO categories (id, name, "nameRu", icon, color, "sortOrder", "isActive", "createdAt", "updatedAt") VALUES
        ('e0000001-0000-0000-0000-000000000001', 'Напитки', 'Напитки', 'cup-soda', '#3B82F6', 0, true, NOW(), NOW()),
        ('e0000001-0000-0000-0000-000000000002', 'Еда', 'Еда', 'utensils', '#F59E0B', 1, true, NOW(), NOW()),
        ('e0000001-0000-0000-0000-000000000003', 'Десерты', 'Десерты', 'cake', '#EC4899', 2, true, NOW(), NOW())
      ON CONFLICT DO NOTHING;

      INSERT INTO products (id, name, "nameRu", "nameEn", "nameUz", sku, price, cost, "categoryId", "isActive", "createdAt", "updatedAt") VALUES
        ('f0000001-0000-0000-0000-000000000001', 'Чай', 'Чай', 'Tea', 'Choy', 'DRINK-001', 5000, 2000, 'e0000001-0000-0000-0000-000000000001', true, NOW(), NOW()),
        ('f0000001-0000-0000-0000-000000000002', 'Кофе', 'Кофе', 'Coffee', 'Kofe', 'DRINK-002', 15000, 5000, 'e0000001-0000-0000-0000-000000000001', true, NOW(), NOW()),
        ('f0000001-0000-0000-0000-000000000003', 'Плов', 'Плов', 'Plov', 'Palov', 'FOOD-001', 25000, 12000, 'e0000001-0000-0000-0000-000000000002', true, NOW(), NOW()),
        ('f0000001-0000-0000-0000-000000000004', 'Самса', 'Самса', 'Samsa', 'Samsa', 'FOOD-002', 8000, 3000, 'e0000001-0000-0000-0000-000000000002', true, NOW(), NOW()),
        ('f0000001-0000-0000-0000-000000000005', 'Торт', 'Торт', 'Cake', 'Tort', 'DES-001', 35000, 18000, 'e0000001-0000-0000-0000-000000000003', true, NOW(), NOW())
      ON CONFLICT DO NOTHING;

      SELECT 'done' as status;
    `;

    await client.query(sql);
    await client.query('NOTIFY pgrst, \'reload schema\'');
    await client.end();

    return json(res, { message: 'Seed completed successfully', status: 'ok' }, 200, origin);
  } catch (e: unknown) {
    await client.end();
    const msg = e instanceof Error ? e.message : String(e);
    return error(res, msg, 500, origin);
  }
}
