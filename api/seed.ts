import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase, json, error, corsPreflight } from './lib/supabase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') return corsPreflight(res, req.headers.origin);
  if (req.method !== 'POST') return error(res, 'POST only', 405, req.headers.origin);
  const origin = req.headers.origin;

  const secret = req.headers['x-seed-secret'];
  if (secret !== 'openpos-seed-2026') return error(res, 'Forbidden', 403, origin);

  const results: Record<string, unknown> = {};

  const roles = [
    { id: 'a0000001-0000-0000-0000-000000000001', name: 'OWNER', description: 'Владелец системы' },
    { id: 'a0000001-0000-0000-0000-000000000002', name: 'ADMINISTRATOR', description: 'Администратор' },
    { id: 'a0000001-0000-0000-0000-000000000003', name: 'CASHIER', description: 'Кассир' },
    { id: 'a0000001-0000-0000-0000-000000000004', name: 'WAITER', description: 'Официант' },
    { id: 'a0000001-0000-0000-0000-000000000005', name: 'KITCHEN', description: 'Повар' },
  ];
  const { error: rolesErr } = await supabase.from('roles').upsert(roles);
  results.roles = rolesErr ? rolesErr.message : 'ok';

  const company = { id: 'b0000001-0000-0000-0000-000000000001', name: 'OpenPOS Demo', inn: '123456789', phone: '+998901234567' };
  const { error: compErr } = await supabase.from('companies').upsert(company);
  results.company = compErr ? compErr.message : 'ok';

  const branch = { id: 'c0000001-0000-0000-0000-000000000001', name: 'Главный филиал', address: 'Ташкент', companyId: company.id, phone: '+998901234567', isActive: true };
  const { error: branchErr } = await supabase.from('branches').upsert(branch);
  results.branch = branchErr ? branchErr.message : 'ok';

  const bcrypt = await import('bcryptjs');
  const bcryptDefault = bcrypt.default ?? bcrypt;
  const passwordHash = await bcryptDefault.hash('admin123', 12);
  const adminUser = {
    id: 'd0000001-0000-0000-0000-000000000001',
    fullName: 'Администратор',
    username: 'admin',
    passwordHash,
    isActive: true,
    roleId: roles[0].id,
    branchId: branch.id,
  };
  const { error: userErr } = await supabase.from('users').upsert(adminUser);
  results.adminUser = userErr ? userErr.message : 'ok';

  const categories = [
    { id: 'e0000001-0000-0000-0000-000000000001', name: 'Напитки', nameRu: 'Напитки', icon: 'cup-soda', color: '#3B82F6', sortOrder: 0, isActive: true },
    { id: 'e0000001-0000-0000-0000-000000000002', name: 'Еда', nameRu: 'Еда', icon: 'utensils', color: '#F59E0B', sortOrder: 1, isActive: true },
    { id: 'e0000001-0000-0000-0000-000000000003', name: 'Десерты', nameRu: 'Десерты', icon: 'cake', color: '#EC4899', sortOrder: 2, isActive: true },
  ];
  const { error: catErr } = await supabase.from('categories').upsert(categories);
  results.categories = catErr ? catErr.message : 'ok';

  const products = [
    { id: 'f0000001-0000-0000-0000-000000000001', name: 'Чай', nameRu: 'Чай', sku: 'DRINK-001', price: 5000, categoryId: categories[0].id, isActive: true, unit: 'шт', stockQuantity: 100 },
    { id: 'f0000001-0000-0000-0000-000000000002', name: 'Кофе', nameRu: 'Кофе', sku: 'DRINK-002', price: 15000, categoryId: categories[0].id, isActive: true, unit: 'шт', stockQuantity: 100 },
    { id: 'f0000001-0000-0000-0000-000000000003', name: 'Плов', nameRu: 'Плов', sku: 'FOOD-001', price: 25000, categoryId: categories[1].id, isActive: true, unit: 'шт', stockQuantity: 50 },
  ];
  const { error: prodErr } = await supabase.from('products').upsert(products);
  results.products = prodErr ? prodErr.message : 'ok';

  return json(res, results, 200, origin);
}
