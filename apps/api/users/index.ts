import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase, json, error } from '../../lib/supabase';

function verifyToken(req: VercelRequest): Record<string, unknown> | null {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return null;
  try {
    const jwt = require('jsonwebtoken') as typeof import('jsonwebtoken');
    return jwt.verify(auth.slice(7), process.env.JWT_SECRET ?? 'openpos-mn7k2x9p4r8t1w5q3j6y0b8n2m4vc9') as Record<string, unknown>;
  } catch { return null; }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') return json({}, 200, req.headers.origin);
  const origin = req.headers.origin;
  const payload = verifyToken(req);
  if (!payload) return error('Unauthorized', 401, origin);
  if (!['OWNER', 'ADMINISTRATOR'].includes(payload.role as string)) return error('Forbidden', 403, origin);

  switch (req.method) {
    case 'GET': {
      const { page = '1', limit = '50', search } = req.query;
      const p = Math.max(1, Number(page));
      const l = Math.min(200, Math.max(1, Number(limit)));
      const offset = (p - 1) * l;

      let query = supabase.from('users').select('id, fullName, username, isActive, roleId, branchId, lastLoginAt, pinCode, role:roles(id, name)', { count: 'exact' }).is('deletedAt', null);

      if (search) query = query.or(`fullName.ilike.%${search}%,username.ilike.%${search}%`);

      query = query.order('fullName').range(offset, offset + l - 1);
      const { data, error: e, count } = await query;
      if (e) return error(e.message, 500, origin);
      return json({ items: data, total: count, page: p, limit: l }, 200, origin);
    }
    case 'POST': {
      const bcrypt = await import('bcryptjs');
      const { fullName, username, password, roleId, branchId } = req.body;
      const hash = await bcrypt.hash(password, 12);
      const { data, error: e } = await supabase.from('users').insert({ fullName, username, passwordHash: hash, roleId, branchId }).select('id, fullName, username, role:roles(name)').single();
      if (e) return error(e.message, 500, origin);
      return json(data, 201, origin);
    }
    default:
      return error('Method not allowed', 405, origin);
  }
}
