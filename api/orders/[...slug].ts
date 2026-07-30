import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase, json, error, corsPreflight, verifyToken } from '../../api-shared/supabase';

function generateOrderNumber(): string {
  const now = new Date();
  return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(Math.floor(Math.random() * 99999)).padStart(5, '0')}`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') return corsPreflight(res, req.headers.origin);
  const origin = req.headers.origin;
  const payload = verifyToken(req);
  if (!payload) return error(res, 'Unauthorized', 401, origin);

  const slug = (req.query['...slug'] as string[] ?? []) as string[];
  const id = slug[0];

  if (req.method === 'GET' && id === 'open') {
    const { count } = await supabase.from('orders').select('*', { count: 'exact', head: true }).in('status', ['PENDING', 'SENT_TO_KITCHEN', 'PREPARING', 'READY']);
    return json(res, { count: count ?? 0 }, 200, origin);
  }

  if (req.method === 'GET' && id) {
    const { data, error: e } = await supabase.from('orders').select('*, items:order_items(*, product:products(id, name, nameRu, price)), cashier:users!orders_cashierId_fkey(fullName), waiter:users!orders_waiterId_fkey(fullName)').eq('id', id).single();
    if (e || !data) return error(res, 'Order not found', 404, origin);
    return json(res, data, 200, origin);
  }
  if ((req.method === 'PATCH' || req.method === 'DELETE') && id) {
    if (req.method === 'PATCH') {
      const { data, error: e } = await supabase.from('orders').update(req.body).eq('id', id).select().single();
      if (e) return error(res, e.message, 500, origin);
      return json(res, data, 200, origin);
    }
    const { error: e } = await supabase.from('orders').update({ status: 'CANCELLED', deletedAt: new Date().toISOString() }).eq('id', id);
    if (e) return error(res, e.message, 500, origin);
    return json(res, { message: 'Cancelled' }, 200, origin);
  }

  if (req.method === 'GET') {
    const { page = '1', limit = '50', status, search } = req.query;
    const p = Math.max(1, Number(page));
    const l = Math.min(200, Math.max(1, Number(limit)));
    const offset = (p - 1) * l;
    let query = supabase.from('orders').select('*, items:order_items(*, product:products(id, name, nameRu, price)), cashier:users!orders_cashierId_fkey(fullName)', { count: 'exact' }).is('deletedAt', null);
    if (status) query = query.eq('status', status);
    if (search) query = query.ilike('orderNumber', `%${search}%`);
    const { data, error: e, count } = await query.order('createdAt', { ascending: false }).range(offset, offset + l - 1);
    if (e) return error(res, e.message, 500, origin);
    return json(res, { items: data, total: count, page: p, limit: l }, 200, origin);
  }

  if (req.method === 'POST') {
    const { items, cashierId, waiterId, tableId, customerId, discount, notes } = req.body;
    if (!items?.length) return error(res, 'items обязателен', 400, origin);
    let subtotal = 0;
    for (const item of items) subtotal += item.quantity * item.unitPrice;
    const total = subtotal - (discount ?? 0);
    const orderNumber = generateOrderNumber();
    const branchId = (payload.branchId as string) || '00000000-0000-0000-0000-000000000000';
    const { data: order, error: e } = await supabase.from('orders').insert({
      orderNumber, status: 'PENDING', cashierId: cashierId ?? payload.sub, waiterId, tableId, customerId,
      subtotal, discount: discount ?? 0, tax: 0, total, notes, branchId,
    }).select().single();
    if (e) return error(res, e.message, 500, origin);
    for (const item of items) {
      await supabase.from('order_items').insert({
        orderId: order.id, productId: item.productId, quantity: item.quantity, unitPrice: item.unitPrice,
        discount: item.discount ?? 0, total: item.quantity * item.unitPrice - (item.discount ?? 0), note: item.note,
      });
    }
    const { data: fullOrder } = await supabase.from('orders').select('*, items:order_items(*, product:products(id, name, nameRu, price)), cashier:users!orders_cashierId_fkey(fullName)').eq('id', order.id).single();
    return json(res, fullOrder, 201, origin);
  }

  return error(res, 'Method not allowed', 405, origin);
}
