import { createClient } from '@supabase/supabase-js';

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
