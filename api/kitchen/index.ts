import type { VercelRequest, VercelResponse } from '@vercel/node';
import { json, error, corsPreflight } from '../lib/supabase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') return corsPreflight(res, req.headers.origin);
  return json(res, { message: 'Kitchen API', version: '1.0' }, 200, req.headers.origin);
}
