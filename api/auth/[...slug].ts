import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase, json, error, corsPreflight, verifyToken } from '../lib/supabase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') return corsPreflight(res, req.headers.origin);
  const origin = req.headers.origin;
  const raw = req.query['...slug'];
  const slug: string[] = Array.isArray(raw) ? raw : (typeof raw === 'string' ? raw.split('/') : []);
  const action = slug[0] ?? '';
  return json(res, { raw, slug, action, method: req.method, q: Object.keys(req.query) }, 200, origin);

  if (req.method === 'POST' && action === 'login') {
    const { username, password } = req.body;
    if (!username || !password) return error(res, 'username и password обязательны', 400, origin);

    const { data: user, error: findError } = await supabase
      .from('users').select('*, role:roles(*)').eq('username', username).is('deletedAt', null).single();
    if (findError || !user) return error(res, 'Неверное имя пользователя или пароль', 401, origin);
    if (!user.isActive) return error(res, 'Аккаунт деактивирован', 401, origin);

    const bcrypt = await import('bcryptjs');
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return error(res, 'Неверное имя пользователя или пароль', 401, origin);

    const { data: session } = await supabase.from('sessions').insert({
      userId: user.id, deviceId: (req.headers['x-device-id'] as string) ?? 'unknown',
      ipAddress: (req.headers['x-forwarded-for'] as string) ?? null, lastActivityAt: new Date().toISOString(),
    }).select().single();

    const jwt = await import('jsonwebtoken');
    const SECRET = process.env.JWT_SECRET ?? 'openpos-mn7k2x9p4r8t1w5q3j6y0b8n2m4vc9';
    const roleName = (user.role as { name: string }).name;
    const payload = { sub: user.id, username: user.username, role: roleName, companyId: null, branchId: user.branchId, sessionId: session?.id };
    const accessToken = jwt.default.sign(payload, SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.default.sign({ ...payload, type: 'refresh' }, SECRET, { expiresIn: '30d' });

    await supabase.from('refresh_tokens').insert({ userId: user.id, token: refreshToken, expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), sessionId: session?.id });
    await supabase.from('users').update({ lastLoginAt: new Date().toISOString() }).eq('id', user.id);

    return json(res, { accessToken, refreshToken, expiresIn: '15m', user: { id: user.id, fullName: user.fullName, username: user.username, role: roleName } }, 200, origin);
  }

  if (req.method === 'POST' && action === 'supabase-login') {
    const { email, fullName, phone, supabaseId } = req.body;
    if (!email || !fullName || !supabaseId) return error(res, 'email, fullName, supabaseId обязательны', 400, origin);
    const username = email || phone || supabaseId;

    let { data: user } = await supabase.from('users').select('*, role:roles(*)').eq('username', username).is('deletedAt', null).single();

    if (!user) {
      const { count } = await supabase.from('users').select('*', { count: 'exact', head: true });
      const { data: ownerRole } = await supabase.from('roles').select('id').eq('name', 'OWNER').single();
      const { data: cashierRole } = await supabase.from('roles').select('id').eq('name', 'CASHIER').single();
      const { data: branch } = await supabase.from('branches').select('id').limit(1).single();
      const role = (count === 0 && ownerRole) ? ownerRole : cashierRole;
      if (!role) return error(res, 'Роль не найдена', 500, origin);

      const bcrypt = await import('bcryptjs');
      const { data: newUser } = await supabase.from('users').insert({
        fullName, username, passwordHash: await bcrypt.hash(supabaseId, 12), roleId: role.id, branchId: branch?.id,
      }).select('*, role:roles(*)').single();
      user = newUser;
    }
    if (!user) return error(res, 'Ошибка создания пользователя', 500, origin);

    const { data: session } = await supabase.from('sessions').insert({ userId: user.id, deviceId: 'supabase-web', lastActivityAt: new Date().toISOString() }).select().single();
    const jwt = await import('jsonwebtoken');
    const SECRET = process.env.JWT_SECRET ?? 'openpos-mn7k2x9p4r8t1w5q3j6y0b8n2m4vc9';
    const roleName = (user.role as { name: string }).name;
    const payload = { sub: user.id, username: user.username, role: roleName, companyId: null, branchId: user.branchId, sessionId: session?.id };
    const accessToken = jwt.default.sign(payload, SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.default.sign({ ...payload, type: 'refresh' }, SECRET, { expiresIn: '30d' });
    await supabase.from('refresh_tokens').insert({ userId: user.id, token: refreshToken, expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), sessionId: session?.id });
    await supabase.from('users').update({ lastLoginAt: new Date().toISOString() }).eq('id', user.id);
    return json(res, { accessToken, refreshToken, expiresIn: '15m', user: { id: user.id, fullName: user.fullName, username: user.username, role: roleName } }, 200, origin);
  }

  if (req.method === 'POST' && action === 'refresh') {
    const { refreshToken: rt } = req.body;
    if (!rt) return error(res, 'refreshToken обязателен', 400, origin);
    const jwt = await import('jsonwebtoken');
    const SECRET = process.env.JWT_SECRET ?? 'openpos-mn7k2x9p4r8t1w5q3j6y0b8n2m4vc9';
    let payload: Record<string, unknown>;
    try { payload = jwt.default.verify(rt, SECRET) as Record<string, unknown>; } catch { return error(res, 'Invalid refresh token', 401, origin); }
    const { data: stored } = await supabase.from('refresh_tokens').select('*').eq('token', rt).single();
    if (stored?.isRevoked) return error(res, 'Refresh token has been revoked', 401, origin);
    const { data: session } = await supabase.from('sessions').select('*').eq('id', payload.sessionId).single();
    if (!session?.isActive) return error(res, 'Session has expired', 401, origin);
    const newPayload = { sub: payload.sub, username: payload.username, role: payload.role, companyId: payload.companyId, branchId: payload.branchId, sessionId: payload.sessionId };
    const newAccessToken = jwt.default.sign(newPayload, SECRET, { expiresIn: '15m' });
    const newRefreshToken = jwt.default.sign({ ...newPayload, type: 'refresh' }, SECRET, { expiresIn: '30d' });
    if (stored) await supabase.from('refresh_tokens').update({ isRevoked: true }).eq('id', stored.id);
    await supabase.from('refresh_tokens').insert({ userId: payload.sub as string, token: newRefreshToken, expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), sessionId: payload.sessionId as string });
    return json(res, { accessToken: newAccessToken, refreshToken: newRefreshToken, expiresIn: '15m' }, 200, origin);
  }

  if (req.method === 'POST' && action === 'logout') {
    const payload = verifyToken(req);
    if (!payload) return error(res, 'Unauthorized', 401, origin);
    await supabase.from('sessions').update({ isActive: false }).eq('id', payload.sessionId);
    await supabase.from('refresh_tokens').update({ isRevoked: true }).eq('userId', payload.sub);
    return json(res, { message: 'Logged out successfully' }, 200, origin);
  }

  if (req.method === 'GET' && action === 'me') {
    const payload = verifyToken(req);
    if (!payload) return error(res, 'Unauthorized', 401, origin);
    const { data: user } = await supabase.from('users').select('id, fullName, username, role:roles(name), branchId, pinCode').eq('id', payload.sub).single();
    if (!user) return error(res, 'User not found', 404, origin);
    const roleName = Array.isArray(user.role) ? user.role[0]?.name : (user.role as { name: string })?.name;
    return json(res, { id: user.id, fullName: user.fullName, username: user.username, role: roleName, branchId: user.branchId, hasPinCode: !!user.pinCode }, 200, origin);
  }

  if (req.method === 'POST' && action === 'verify-pin') {
    const { userId, pin } = req.body;
    const { data: user } = await supabase.from('users').select('*').eq('id', userId).single();
    if (!user) return error(res, 'Пользователь не найден', 404, origin);
    if (!user.pinCode) return error(res, 'PIN не установлен', 400, origin);
    if (user.pinCode !== pin) return error(res, 'Неверный PIN', 401, origin);
    return json(res, { message: 'PIN верный', valid: true }, 200, origin);
  }

  if (req.method === 'GET' && action === 'users-for-pin') {
    const payload = verifyToken(req);
    if (!payload) return error(res, 'Unauthorized', 401, origin);
    const { data: users } = await supabase.from('users').select('id, fullName, username, pinCode, role:roles(name)').is('deletedAt', null).eq('isActive', true).order('fullName');
    return json(res, (users ?? []).map((u: Record<string, unknown>) => ({
      id: u.id, fullName: u.fullName, username: u.username,
      role: Array.isArray(u.role) ? (u.role as Array<{name: string}>)[0]?.name : (u.role as { name: string })?.name,
      hasPinCode: !!u.pinCode,
    })), 200, origin);
  }

  return error(res, 'Not found', 404, origin);
}
