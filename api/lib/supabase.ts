import { createClient } from '@supabase/supabase-js';
import type { VercelRequest } from '@vercel/node';
import jwt from 'jsonwebtoken';

const supabaseUrl = process.env.SUPABASE_URL ?? 'https://ytanvpjxqfdxcvghmzny.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_ANON_KEY ?? 'sb_publishable_HSPcuBxHV5KSmr0Pb-CQjQ_ORmvr90l';

export const supabase = createClient(supabaseUrl, supabaseServiceKey);

export function corsHeaders(origin?: string): Record<string, string> {
  const allowedOrigins = [
    'https://openpos-terminal.vercel.app',
    'http://localhost:5173',
    'http://localhost:5174',
  ];
  const allowOrigin = origin && allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Device-Id',
    'Access-Control-Allow-Credentials': 'true',
  };
}

export function json(data: unknown, status = 200, origin?: string): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
  });
}

export function error(message: string, status = 400, origin?: string): Response {
  return json({ message }, status, origin);
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
