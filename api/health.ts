import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase, json, error } from './lib/supabase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') return json({}, 200, req.headers.origin);
  return json({ status: 'ok', timestamp: new Date().toISOString(), version: '1.0', engine: 'vercel-serverless' }, 200, req.headers.origin);
}
