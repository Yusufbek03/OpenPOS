import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';

const supabaseUrl = process.env.SUPABASE_URL ?? 'https://ytanvpjxqfdxcvghmzny.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_ANON_KEY ?? 'sb_publishable_HSPcuBxHV5KSmr0Pb-CQjQ_ORmvr90l';

export const supabase = createClient(supabaseUrl, supabaseServiceKey);

const ALLOWED_ORIGINS = [
  'https://openpos-terminal.vercel.app',
  'https://*.vercel.app',
  'http://localhost:5173',
  'http://localhost:5174',
];

function setCors(res: VercelResponse, origin?: string) {
  const allowOrigin = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  res.setHeader('Access-Control-Allow-Origin', allowOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Device-Id');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
}

export function json(res: VercelResponse, data: unknown, status = 200, origin?: string) {
  setCors(res, origin);
  return res.status(status).json(data);
}

export function error(res: VercelResponse, message: string, status = 400, origin?: string) {
  return json(res, { message }, status, origin);
}

export function corsPreflight(res: VercelResponse, origin?: string) {
  setCors(res, origin);
  return res.status(200).end();
}

const JWT_SECRET = process.env.JWT_SECRET ?? 'openpos-mn7k2x9p4r8t1w5q3j6y0b8n2m4vc9';

export function verifyToken(req: VercelRequest): Record<string, unknown> | null {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return null;
  try {
    return jwt.verify(authHeader.slice(7), JWT_SECRET) as Record<string, unknown>;
  } catch {
    return null;
  }
}
