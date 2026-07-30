import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase, json, error, verifyToken } from './lib/supabase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') return json({}, 200, req.headers.origin);
  const origin = req.headers.origin;
  const payload = verifyToken(req);
  if (!payload) return error('Unauthorized', 401, origin);

  const url = req.url ?? '';
  const idMatch = url.match(/\/api\/categories\/([a-f0-9-]+)/);
  const id = idMatch?.[1];

  if (req.method === 'GET' && id) {
    const { data, error: e } = await supabase.from('categories').select('*').eq('id', id).single();
    if (e || !data) return error('Category not found', 404, origin);
    return json(data, 200, origin);
  }
  if ((req.method === 'PATCH' || req.method === 'DELETE') && id) {
    if (req.method === 'PATCH') {
      const { data, error: e } = await supabase.from('categories').update(req.body).eq('id', id).select('*').single();
      if (e) return error(e.message, 500, origin);
      return json(data, 200, origin);
    }
    const { error: e } = await supabase.from('categories').update({ deletedAt: new Date().toISOString() }).eq('id', id);
    if (e) return error(e.message, 500, origin);
    return json({ message: 'Deleted' }, 200, origin);
  }

  if (req.method === 'GET') {
    const { data, error: e } = await supabase.from('categories').select('*').is('deletedAt', null).order('sortOrder');
    if (e) return error(e.message, 500, origin);
    return json(data, 200, origin);
  }
  if (req.method === 'POST') {
    const { data, error: e } = await supabase.from('categories').insert(req.body).select('*').single();
    if (e) return error(e.message, 500, origin);
    return json(data, 201, origin);
  }
  return error('Method not allowed', 405, origin);
}
