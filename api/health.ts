import type { VercelRequest, VercelResponse } from '@vercel/node';
import { json, corsPreflight } from './lib/supabase';

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') return corsPreflight(res, req.headers.origin);
  return json(res, { status: 'ok', timestamp: new Date().toISOString(), version: '1.0', engine: 'vercel-serverless' }, 200, req.headers.origin);
}
