import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase, json, error } from '../lib/supabase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') return json({}, 200, req.headers.origin);
  if (req.method !== 'POST') return error('Method not allowed', 405, req.headers.origin);

  const origin = req.headers.origin;
  const { email, fullName, phone, supabaseId } = req.body;

  if (!email || !fullName || !supabaseId) return error('email, fullName, supabaseId обязательны', 400, origin);

  const username = email || phone || supabaseId;

  let { data: user } = await supabase
    .from('users')
    .select('*, role:roles(*)')
    .eq('username', username)
    .is('deletedAt', null)
    .single();

  if (!user) {
    const { count } = await supabase.from('users').select('*', { count: 'exact', head: true });
    const { data: ownerRole } = await supabase.from('roles').select('id').eq('name', 'OWNER').single();
    const { data: cashierRole } = await supabase.from('roles').select('id').eq('name', 'CASHIER').single();
    const { data: branch } = await supabase.from('branches').select('id').limit(1).single();

    const role = (count === 0 && ownerRole) ? ownerRole : cashierRole;
    if (!role) return error('Роль не найдена', 500, origin);

    const bcrypt = await import('bcryptjs');
    const { data: newUser } = await supabase.from('users').insert({
      fullName,
      username,
      passwordHash: await bcrypt.hash(supabaseId, 12),
      roleId: role.id,
      branchId: branch?.id,
    }).select('*, role:roles(*)').single();

    user = newUser;
  }

  if (!user) return error('Ошибка создания пользователя', 500, origin);

  const { data: session } = await supabase.from('sessions').insert({
    userId: user.id,
    deviceId: 'supabase-web',
    lastActivityAt: new Date().toISOString(),
  }).select().single();

  const jwt = await import('jsonwebtoken');
  const JWT_SECRET = process.env.JWT_SECRET ?? 'openpos-mn7k2x9p4r8t1w5q3j6y0b8n2m4vc9';
  const payload = { sub: user.id, username: user.username, role: user.role.name, companyId: null, branchId: user.branchId, sessionId: session?.id };
  const accessToken = jwt.default.sign(payload, JWT_SECRET, { expiresIn: '15m' });
  const refreshToken = jwt.default.sign({ ...payload, type: 'refresh' }, JWT_SECRET, { expiresIn: '30d' });

  await supabase.from('refresh_tokens').insert({ userId: user.id, token: refreshToken, expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), sessionId: session?.id });
  await supabase.from('users').update({ lastLoginAt: new Date().toISOString() }).eq('id', user.id);

  return json({ accessToken, refreshToken, expiresIn: '15m', user: { id: user.id, fullName: user.fullName, username: user.username, role: user.role.name } }, 200, origin);
}
