import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase, json, error } from '../lib/supabase';

function verifyToken(req: VercelRequest): Record<string, unknown> | null {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return null;
  try {
    const jwt = require('jsonwebtoken') as typeof import('jsonwebtoken');
    return jwt.verify(auth.slice(7), process.env.JWT_SECRET ?? 'openpos-mn7k2x9p4r8t1w5q3j6y0b8n2m4vc9') as Record<string, unknown>;
  } catch { return null; }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') return json({}, 200, req.headers.origin);
  const origin = req.headers.origin;
  const payload = verifyToken(req);
  if (!payload) return error('Unauthorized', 401, origin);

  if (req.method === 'POST') {
    try {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;
      if (!file) return error('file обязателен', 400, origin);

      if (!file.type.startsWith('image/')) return error('Только изображения', 400, origin);
      if (file.size > 5 * 1024 * 1024) return error('Максимум 5MB', 400, origin);

      const ext = file.name.split('.').pop() ?? 'jpg';
      const filename = `${crypto.randomUUID()}.${ext}`;

      const buffer = Buffer.from(await file.arrayBuffer());
      const { error: uploadError } = await supabase.storage
        .from('uploads')
        .upload(`categories/${filename}`, buffer, { contentType: file.type });

      if (uploadError) return error(uploadError.message, 500, origin);

      const { data: urlData } = supabase.storage.from('uploads').getPublicUrl(`categories/${filename}`);

      return json({ url: urlData.publicUrl }, 200, origin);
    } catch (e) {
      return error('Ошибка загрузки файла', 500, origin);
    }
  }

  return error('Method not allowed', 405, origin);
}
