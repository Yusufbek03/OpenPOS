import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase, json, error, corsPreflight, verifyToken } from '../../api-shared/supabase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') return corsPreflight(res, req.headers.origin);
  const origin = req.headers.origin;
  const payload = verifyToken(req);
  if (!payload) return error(res, 'Unauthorized', 401, origin);

  if (req.method === 'GET') {
    const { page = '1', limit = '50', search, categoryId } = req.query;
    const p = Math.max(1, Number(page));
    const l = Math.min(200, Math.max(1, Number(limit)));
    const offset = (p - 1) * l;
    let query = supabase.from('products').select('*, category:categories(id, name, nameRu, icon, color, imageUrl)', { count: 'exact' }).is('deletedAt', null);
    if (search) { const s = String(search); query = query.or(`name.ilike.%${s}%,nameRu.ilike.%${s}%,sku.ilike.%${s}%,barcode.ilike.%${s}%`); }
    if (categoryId) query = query.eq('categoryId', categoryId);
    const { data, error: e, count } = await query.order('createdAt', { ascending: false }).range(offset, offset + l - 1);
    if (e) return error(res, e.message, 500, origin);
    return json(res, { items: data, total: count, page: p, limit: l }, 200, origin);
  }
  if (req.method === 'POST') {
    const body = req.body;
    if (!body.sku) body.sku = `SKU-${Date.now()}`;
    const { data, error: e } = await supabase.from('products').insert(body).select('*, category:categories(*)').single();
    if (e) return error(res, e.message, 500, origin);
    return json(res, data, 201, origin);
  }
  return error(res, 'Method not allowed', 405, origin);
}
