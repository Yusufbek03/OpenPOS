import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase, json, error } from '../lib/supabase';

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

  const { id } = req.query as { id: string };

  switch (req.method) {
    case 'GET': {
      const { data, error: e } = await supabase.from('products').select('*, category:categories(*)').eq('id', id).single();
      if (e || !data) return error('Product not found', 404, origin);
      return json(data, 200, origin);
    }
    case 'PATCH': {
      const { data, error: e } = await supabase.from('products').update(req.body).eq('id', id).select('*, category:categories(*)').single();
      if (e) return error(e.message, 500, origin);
      return json(data, 200, origin);
    }
    case 'DELETE': {
      const { error: e } = await supabase.from('products').update({ deletedAt: new Date().toISOString() }).eq('id', id);
      if (e) return error(e.message, 500, origin);
      return json({ message: 'Deleted' }, 200, origin);
    }
    default:
      return error('Method not allowed', 405, origin);
  }
}
