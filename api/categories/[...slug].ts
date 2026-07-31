import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase, json, error, corsPreflight, verifyToken } from '../../api-shared/supabase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') return corsPreflight(res, req.headers.origin);
  const origin = req.headers.origin;
  const payload = verifyToken(req);
  if (!payload) return error(res, 'Unauthorized', 401, origin);

  const raw = req.query['...slug'];
  const slug: string[] = Array.isArray(raw) ? raw : (typeof raw === 'string' ? raw.split('/') : []);
  const id = slug[0];

  if (req.method === 'GET' && id) {
    const { data, error: e } = await supabase.from('categories').select('*').eq('id', id).single();
    if (e || !data) return error(res, 'Category not found', 404, origin);
    return json(res, data, 200, origin);
  }
  if ((req.method === 'PATCH' || req.method === 'DELETE') && id) {
    if (req.method === 'PATCH') {
      const { data, error: e } = await supabase.from('categories').update(req.body).eq('id', id).select('*').single();
      if (e) return error(res, e.message, 500, origin);
      return json(res, data, 200, origin);
    }
    const { error: e } = await supabase.from('categories').update({ deletedAt: new Date().toISOString() }).eq('id', id);
    if (e) return error(res, e.message, 500, origin);
    return json(res, { message: 'Deleted' }, 200, origin);
  }

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
