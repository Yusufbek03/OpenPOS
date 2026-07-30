import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase, json, error } from '../lib/supabase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') return json({}, 200, req.headers.origin);
  if (req.method !== 'POST') return error('Method not allowed', 405, req.headers.origin);

  const origin = req.headers.origin;
  const { username, password } = req.body;

  if (!username || !password) return error('username и password обязательны', 400, origin);

  const { data: user, findError } = await supabase
    .from('users')
    .select('*, role:roles(*)')
    .eq('username', username)
    .is('deletedAt', null)
    .single();

  if (findError || !user) return error('Неверное имя пользователя или пароль', 401, origin);
  if (!user.isActive) return error('Аккаунт деактивирован', 401, origin);

  const bcrypt = await import('bcryptjs');
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return error('Неверное имя пользователя или пароль', 401, origin);

  const session = await supabase.from('sessions').insert({
    userId: user.id,
    deviceId: req.headers['x-device-id'] ?? 'unknown',
    ipAddress: req.headers['x-forwarded-for'] ?? null,
    lastActivityAt: new Date().toISOString(),
  }).select().single();

  const jwt = await import('jsonwebtoken');
  const JWT_SECRET = process.env.JWT_SECRET ?? 'openpos-mn7k2x9p4r8t1w5q3j6y0b8n2m4vc9';

  const payload = { sub: user.id, username: user.username, role: user.role.name, companyId: null, branchId: user.branchId, sessionId: session.data?.id };
  const accessToken = jwt.default.sign(payload, JWT_SECRET, { expiresIn: '15m' });
  const refreshToken = jwt.default.sign({ ...payload, type: 'refresh' }, JWT_SECRET, { expiresIn: '30d' });

  await supabase.from('refresh_tokens').insert({
    userId: user.id,
    token: refreshToken,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    sessionId: session.data?.id,
  });

  await supabase.from('users').update({ lastLoginAt: new Date().toISOString() }).eq('id', user.id);

  return json({
    accessToken,
    refreshToken,
    expiresIn: '15m',
    user: { id: user.id, fullName: user.fullName, username: user.username, role: user.role.name },
  }, 200, origin);
}
