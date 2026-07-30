import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase, json, error, corsPreflight, verifyToken } from '../../api-shared/supabase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') return corsPreflight(res, req.headers.origin);
  const origin = req.headers.origin;
  const payload = verifyToken(req);
  if (!payload) return error(res, 'Unauthorized', 401, origin);

  if (req.method === 'GET') {
    const { data, error: e } = await supabase.from('categories').select('*').is('deletedAt', null).order('sortOrder');
    if (e) return error(res, e.message, 500, origin);
    return json(res, data, 200, origin);
  }
  if (req.method === 'POST') {
    const { data, error: e } = await supabase.from('categories').insert(req.body).select('*').single();
    if (e) return error(res, e.message, 500, origin);
    return json(res, data, 201, origin);
  }
  return error(res, 'Method not allowed', 405, origin);
}
