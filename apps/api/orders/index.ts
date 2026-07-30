import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase, json, error } from '../../lib/supabase';

function verifyToken(req: VercelRequest): Record<string, unknown> | null {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return null;
  try {
    const jwt = require('jsonwebtoken') as typeof import('jsonwebtoken');
    return jwt.verify(auth.slice(7), process.env.JWT_SECRET ?? 'openpos-mn7k2x9p4r8t1w5q3j6y0b8n2m4vc9') as Record<string, unknown>;
  } catch { return null; }
}

function generateOrderNumber(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const n = String(Math.floor(Math.random() * 99999)).padStart(5, '0');
  return `${y}${m}${d}-${n}`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') return json({}, 200, req.headers.origin);
  const origin = req.headers.origin;
  const payload = verifyToken(req);
  if (!payload) return error('Unauthorized', 401, origin);

  switch (req.method) {
    case 'GET': {
      const { page = '1', limit = '50', status, search } = req.query;
      const p = Math.max(1, Number(page));
      const l = Math.min(200, Math.max(1, Number(limit)));
      const offset = (p - 1) * l;

      let query = supabase.from('orders').select('*, items:order_items(*, product:products(id, name, nameRu, price)), cashier:users!orders_cashierId_fkey(fullName)', { count: 'exact' }).is('deletedAt', null);

      if (status) query = query.eq('status', status);
      if (search) query = query.ilike('orderNumber', `%${search}%`);

      query = query.order('createdAt', { ascending: false }).range(offset, offset + l - 1);
      const { data, error: e, count } = await query;
      if (e) return error(e.message, 500, origin);
      return json({ items: data, total: count, page: p, limit: l }, 200, origin);
    }
    case 'POST': {
      const { items, cashierId, waiterId, tableId, customerId, discount, notes } = req.body;
      if (!items?.length) return error('items обязателен', 400, origin);

      let subtotal = 0;
      for (const item of items) subtotal += item.quantity * item.unitPrice;
      const tax = items.reduce((sum: number, item: Record<string, unknown>) => {
        return sum + (item.quantity as number) * (item.unitPrice as number) * 0;
      }, 0);
      const total = subtotal - (discount ?? 0) + tax;

      const orderNumber = generateOrderNumber();
      const branchId = (payload.branchId as string) || '00000000-0000-0000-0000-000000000000';

      const { data: order, error: e } = await supabase.from('orders').insert({
        orderNumber,
        status: 'PENDING',
        cashierId: cashierId ?? payload.sub,
        waiterId,
        tableId,
        customerId,
        subtotal,
        discount: discount ?? 0,
        tax,
        total,
        notes,
        branchId,
      }).select().single();

      if (e) return error(e.message, 500, origin);

      for (const item of items) {
        await supabase.from('order_items').insert({
          orderId: order.id,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount ?? 0,
          total: item.quantity * item.unitPrice - (item.discount ?? 0),
          note: item.note,
        });
      }

      const { data: fullOrder } = await supabase.from('orders').select('*, items:order_items(*, product:products(id, name, nameRu, price)), cashier:users!orders_cashierId_fkey(fullName)').eq('id', order.id).single();

      return json(fullOrder, 201, origin);
    }
    default:
      return error('Method not allowed', 405, origin);
  }
}
