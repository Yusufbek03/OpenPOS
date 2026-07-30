import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase, json, error } from '../lib/supabase';

function verifyToken(req: VercelRequest): Record<string, unknown> | null {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return null;
  try {
    const jwt = require('jsonwebtoken') as typeof import('jsonwebtoken');
    return jwt.verify(auth.slice(7), process.env.JWT_SECRET ?? 'openpos-mn7k2x9p4r8t1w5q3j6y0b8n2m4vc9') as Record<string, unknown>;
  } catch {
    return null;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') return json({}, 200, req.headers.origin);
  const origin = req.headers.origin;

  if (req.method === 'GET') {
    const payload = verifyToken(req);
    if (!payload) return error('Unauthorized', 401, origin);

    const { data: user } = await supabase
      .from('users')
      .select('id, fullName, username, role:roles(name), branchId, pinCode')
      .eq('id', payload.sub)
      .single();

    if (!user) return error('User not found', 404, origin);
    return json({ id: user.id, fullName: user.fullName, username: user.username, role: (user.role as Record<string, string>)?.name, branchId: user.branchId, hasPinCode: !!user.pinCode }, 200, origin);
  }

  if (req.method === 'POST') {
    const payload = verifyToken(req);
    if (!payload) return error('Unauthorized', 401, origin);
    const { currentPassword, newPassword } = req.body;

    const { data: user } = await supabase.from('users').select('*').eq('id', payload.sub).single();
    if (!user) return error('User not found', 404, origin);

    const bcrypt = await import('bcryptjs');
    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) return error('Current password is incorrect', 401, origin);

    const hash = await bcrypt.hash(newPassword, 12);
    await supabase.from('users').update({ passwordHash: hash }).eq('id', user.id);
    await supabase.from('sessions').update({ isActive: false }).eq('userId', user.id).eq('isActive', true);
    await supabase.from('refresh_tokens').update({ isRevoked: true }).eq('userId', user.id);

    return json({ message: 'Password changed successfully' }, 200, origin);
  }

  return error('Method not allowed', 405, origin);
}
