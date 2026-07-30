import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase, json, error } from '../lib/supabase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') return json({}, 200, req.headers.origin);
  if (req.method !== 'POST') return error('Method not allowed', 405, req.headers.origin);

  const origin = req.headers.origin;
  const { refreshToken } = req.body;
  if (!refreshToken) return error('refreshToken обязателен', 400, origin);

  const jwt = await import('jsonwebtoken');
  const JWT_SECRET = process.env.JWT_SECRET ?? 'openpos-mn7k2x9p4r8t1w5q3j6y0b8n2m4vc9';

  let payload;
  try {
    payload = jwt.default.verify(refreshToken, JWT_SECRET) as Record<string, unknown>;
  } catch {
    return error('Invalid refresh token', 401, origin);
  }

  const { data: stored } = await supabase.from('refresh_tokens').select('*').eq('token', refreshToken).single();
  if (stored?.isRevoked) return error('Refresh token has been revoked', 401, origin);

  const { data: session } = await supabase.from('sessions').select('*').eq('id', payload.sessionId).single();
  if (!session?.isActive) return error('Session has expired', 401, origin);

  const newPayload = { sub: payload.sub, username: payload.username, role: payload.role, companyId: payload.companyId, branchId: payload.branchId, sessionId: payload.sessionId };
  const newAccessToken = jwt.default.sign(newPayload, JWT_SECRET, { expiresIn: '15m' });
  const newRefreshToken = jwt.default.sign({ ...newPayload, type: 'refresh' }, JWT_SECRET, { expiresIn: '30d' });

  if (stored) {
    await supabase.from('refresh_tokens').update({ isRevoked: true }).eq('id', stored.id);
  }
  await supabase.from('refresh_tokens').insert({ userId: payload.sub, token: newRefreshToken, expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), sessionId: payload.sessionId });

  return json({ accessToken: newAccessToken, refreshToken: newRefreshToken, expiresIn: '15m' }, 200, origin);
}
