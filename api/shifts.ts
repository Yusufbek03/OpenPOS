import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase, json, error, corsPreflight, verifyToken } from '../../api-shared/supabase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') return corsPreflight(res, req.headers.origin);
  const origin = req.headers.origin;
  const payload = verifyToken(req);
  if (!payload) return error(res, 'Unauthorized', 401, origin);

  if (req.method === 'GET') return handleGet(req, res, origin, payload);
  if (req.method === 'POST') return handlePost(req, res, origin, payload);

  return error(res, 'Method not allowed', 405, origin);
}

async function handleGet(req: VercelRequest, res: VercelResponse, origin: string | undefined, payload: Record<string, unknown>) {
  const { action } = req.query;

  if (action === 'current') {
    const { data, error: e } = await supabase
      .from('shifts')
      .select('*')
      .eq('cashierId', payload.sub)
      .eq('status', 'OPEN')
      .order('openedAt', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (e) return error(res, e.message, 500, origin);
    return json(res, { shift: data }, 200, origin);
  }

  if (action === 'x-report') {
    const { shiftId } = req.query;
    if (!shiftId) return error(res, 'shiftId required', 400, origin);

    const { data: shift, error: e1 } = await supabase.from('shifts').select('*').eq('id', shiftId).single();
    if (e1 || !shift) return error(res, 'Shift not found', 404, origin);

    const { data: orders } = await supabase
      .from('orders')
      .select('id, orderNumber, status, total, discount, createdAt, items:order_items(quantity, total, product:products(name, nameRu)), payments:payments(method, amount)')
      .eq('cashierId', shift.cashierId)
      .gte('createdAt', shift.openedAt)
      .lte('createdAt', shift.closedAt || new Date().toISOString())
      .is('deletedAt', null);

    const orderList = (orders || []) as Record<string, unknown>[];
    const completedOrders = orderList.filter((o) => o.status === 'COMPLETED' || o.status === 'PAID');

    const totalSales = completedOrders.reduce((s, o) => s + Number(o.total || 0), 0);
    const totalOrders = completedOrders.length;
    const totalItems = completedOrders.reduce((s, o) => {
      return s + ((o.items || []) as Record<string, unknown>[]).reduce((is2, i) => is2 + Number(i.quantity || 0), 0);
    }, 0);

    const paymentMethods: Record<string, number> = {};
    for (const o of completedOrders) {
      for (const p of ((o.payments || []) as Record<string, unknown>[])) {
        const method = (p.method as string) || 'UNKNOWN';
        paymentMethods[method] = (paymentMethods[method] || 0) + Number(p.amount || 0);
      }
    }

    return json(res, {
      shift,
      report: {
        totalSales,
        totalOrders,
        totalItems,
        paymentMethods,
        cashBalance: shift.closingBalance != null ? shift.closingBalance - shift.openingBalance : null,
      },
    }, 200, origin);
  }

  if (action === 'list') {
    const { page = '1', limit = '20' } = req.query;
    const p = Math.max(1, Number(page));
    const l = Math.min(100, Math.max(1, Number(limit)));
    const offset = (p - 1) * l;

    let query = supabase
      .from('shifts')
      .select('*, cashier:users!shifts_cashierId_fkey(id, fullName, username)', { count: 'exact' })
      .order('openedAt', { ascending: false });

    if (payload.role !== 'OWNER' && payload.role !== 'ADMINISTRATOR') {
      query = query.eq('cashierId', payload.sub);
    }

    query = query.range(offset, offset + l - 1);
    const { data, error: e, count } = await query;
    if (e) return error(res, e.message, 500, origin);
    return json(res, { shifts: data, items: data, total: count, page: p, limit: l }, 200, origin);
  }

  return error(res, 'Unknown action', 400, origin);
}

async function handlePost(req: VercelRequest, res: VercelResponse, origin: string | undefined, payload: Record<string, unknown>) {
  const { action } = req.body;

  if (action === 'open') {
    const { openingBalance = 0 } = req.body;

    const { data: existing } = await supabase
      .from('shifts')
      .select('id')
      .eq('cashierId', payload.sub)
      .eq('status', 'OPEN')
      .limit(1);

    if (existing && existing.length > 0) {
      return error(res, 'Уже есть открытая смена', 400, origin);
    }

    const { data, error: e } = await supabase
      .from('shifts')
      .insert({
        cashierId: payload.sub,
        branchId: payload.branchId || 'c0000001-0000-0000-0000-000000000001',
        openingBalance: Number(openingBalance),
        status: 'OPEN',
      })
      .select()
      .single();

    if (e) return error(res, e.message, 500, origin);
    return json(res, { shift: data, message: 'Смена открыта' }, 201, origin);
  }

  if (action === 'close') {
    const { shiftId, cashCount, notes } = req.body;
    if (!shiftId) return error(res, 'shiftId required', 400, origin);

    const { data: shift, error: e1 } = await supabase.from('shifts').select('*').eq('id', shiftId).eq('status', 'OPEN').single();
    if (e1 || !shift) return error(res, 'Открытая смена не найдена', 404, origin);

    const { data: orders } = await supabase
      .from('orders')
      .select('id, total, payments:payments(method, amount)')
      .eq('cashierId', shift.cashierId)
      .gte('createdAt', shift.openedAt)
      .is('deletedAt', null);

    const orderList = (orders || []) as Record<string, unknown>[];
    const completedOrders = orderList.filter((o) => {
      const status = o.status || 'COMPLETED';
      return status === 'COMPLETED' || status === 'PAID' || status === 'PENDING';
    });

    let totalSales = 0;
    let totalCash = 0;
    let totalCard = 0;
    let totalOther = 0;

    for (const o of completedOrders) {
      totalSales += Number(o.total || 0);
      for (const p of ((o.payments || []) as Record<string, unknown>[])) {
        const method = (p.method as string) || 'UNKNOWN';
        const amount = Number(p.amount || 0);
        if (method === 'CASH') totalCash += amount;
        else if (method === 'CARD') totalCard += amount;
        else totalOther += amount;
      }
    }

    const { data, error: e } = await supabase
      .from('shifts')
      .update({
        status: 'CLOSED',
        closedAt: new Date().toISOString(),
        closingBalance: cashCount != null ? Number(cashCount) : null,
        cashCount: cashCount != null ? Number(cashCount) : null,
        totalSales,
        totalCash,
        totalCard,
        totalOther,
        totalOrders: completedOrders.length,
        notes: notes || null,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', shiftId)
      .select()
      .single();

    if (e) return error(res, e.message, 500, origin);
    return json(res, {
      shift: data,
      report: {
        totalSales,
        totalOrders: completedOrders.length,
        totalCash,
        totalCard,
        totalOther,
        expectedCash: shift.openingBalance + totalCash,
        actualCash: cashCount != null ? Number(cashCount) : null,
        difference: cashCount != null ? Number(cashCount) - (shift.openingBalance + totalCash) : null,
      },
      message: 'Смена закрыта',
    }, 200, origin);
  }

  return error(res, 'Unknown action', 400, origin);
}
