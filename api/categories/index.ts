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

  switch (req.method) {
    case 'GET': {
      const { data, error: e } = await supabase.from('categories').select('*').is('deletedAt', null).order('sortOrder');
      if (e) return error(e.message, 500, origin);
      return json(data, 200, origin);
    }
    case 'POST': {
      const { data, error: e } = await supabase.from('categories').insert(req.body).select('*').single();
      if (e) return error(e.message, 500, origin);
      return json(data, 201, origin);
    }
    default:
      return error('Method not allowed', 405, origin);
  }
}
