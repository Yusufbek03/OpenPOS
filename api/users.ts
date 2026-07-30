import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase, json, error, corsPreflight, verifyToken } from './lib/supabase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') return corsPreflight(res, req.headers.origin);
  const origin = req.headers.origin;
  const payload = verifyToken(req);
  if (!payload) return error(res, 'Unauthorized', 401, origin);

  const url = req.url ?? '';
  const idMatch = url.match(/\/api\/users\/([a-f0-9-]+)/);
  const id = idMatch?.[1];

  if ((req.method === 'PATCH' || req.method === 'DELETE') && id) {
    if (req.method === 'PATCH') {
      const { data, error: e } = await supabase.from('users').update(req.body).eq('id', id).select('id, fullName, username, role:roles(name)').single();
      if (e) return error(res, e.message, 500, origin);
      return json(res, data, 200, origin);
    }
    if (payload.role !== 'OWNER') return error(res, 'Only OWNER can delete users', 403, origin);
    const { error: e } = await supabase.from('users').update({ deletedAt: new Date().toISOString(), isActive: false }).eq('id', id);
    if (e) return error(res, e.message, 500, origin);
    return json(res, { message: 'Deleted' }, 200, origin);
  }

  if (!['OWNER', 'ADMINISTRATOR'].includes(payload.role as string)) return error(res, 'Forbidden', 403, origin);

  if (req.method === 'GET') {
    const { page = '1', limit = '50', search } = req.query;
    const p = Math.max(1, Number(page));
    const l = Math.min(200, Math.max(1, Number(limit)));
    const offset = (p - 1) * l;
    let query = supabase.from('users').select('id, fullName, username, isActive, roleId, branchId, lastLoginAt, pinCode, role:roles(id, name)', { count: 'exact' }).is('deletedAt', null);
    if (search) query = query.or(`fullName.ilike.%${search}%,username.ilike.%${search}%`);
    const { data, error: e, count } = await query.order('fullName').range(offset, offset + l - 1);
    if (e) return error(res, e.message, 500, origin);
    return json(res, { items: data, total: count, page: p, limit: l }, 200, origin);
  }
  if (req.method === 'POST') {
    const bcrypt = await import('bcryptjs');
    const { fullName, username, password, roleId, branchId } = req.body;
    const hash = await bcrypt.hash(password, 12);
    const { data, error: e } = await supabase.from('users').insert({ fullName, username, passwordHash: hash, roleId, branchId }).select('id, fullName, username, role:roles(name)').single();
    if (e) return error(res, e.message, 500, origin);
    return json(res, data, 201, origin);
  }
  return error(res, 'Method not allowed', 405, origin);
}
