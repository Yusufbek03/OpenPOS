import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase, json, error, corsPreflight, verifyToken } from '../../api-shared/supabase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') return corsPreflight(res, req.headers.origin);
  const origin = req.headers.origin;
  const payload = verifyToken(req);
  if (!payload) return error(res, 'Unauthorized', 401, origin);

  const { action } = req.query;

  if (action === 'daily') return handleDaily(req, res, origin);
  if (action === 'period') return handlePeriod(req, res, origin);
  if (action === 'profit') return handleProfit(req, res, origin);

  return error(res, 'Unknown action. Use ?action=daily|period|profit', 400, origin);
}

function parseDateRange(req: VercelRequest) {
  const { from, to } = req.query;
  const now = new Date();
  const start = from ? new Date(String(from)) : new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = to ? new Date(String(to) + 'T23:59:59.999Z') : new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  return { start, end };
}

async function handleDaily(req: VercelRequest, res: VercelResponse, origin: string | undefined) {
  const { start, end } = parseDateRange(req);

  const { data: orders } = await supabase
    .from('orders')
    .select('id, status, total, discount, tax, createdAt, cashierId, items:order_items(quantity, total, product:products(name, nameRu, cost)), payments:payments(method, amount)')
    .is('deletedAt', null);

  const allOrders = (orders || []) as Record<string, unknown>[];
  const dayOrders = allOrders.filter((o) => {
    const d = new Date(o.createdAt as string);
    return d >= start && d <= end;
  });

  const completedOrders = dayOrders.filter((o) => o.status === 'COMPLETED' || o.status === 'PAID');

  const totalSales = completedOrders.reduce((s, o) => s + Number(o.total || 0), 0);
  const totalDiscount = completedOrders.reduce((s, o) => s + Number(o.discount || 0), 0);
  const totalTax = completedOrders.reduce((s, o) => s + Number(o.tax || 0), 0);
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

  const avgCheck = completedOrders.length > 0 ? totalSales / completedOrders.length : 0;

  const methodLabels: Record<string, string> = { CASH: 'Наличные', CARD: 'Карта', CLICK: 'Click', PAYME: 'Payme', UZUM_BANK: 'Uzum Bank' };
  const paymentBreakdown = Object.entries(paymentMethods).map(([method, amount]) => ({
    method,
    label: methodLabels[method] || method,
    amount,
    percentage: totalSales > 0 ? Math.round((amount / totalSales) * 100) : 0,
  }));

  return json(res, {
    period: { from: start.toISOString(), to: end.toISOString() },
    totalOrders: completedOrders.length,
    totalSales,
    totalDiscount,
    totalTax,
    totalItems,
    avgCheck: Math.round(avgCheck),
    paymentBreakdown,
  }, 200, origin);
}

async function handlePeriod(req: VercelRequest, res: VercelResponse, origin: string | undefined) {
  const { from, to, groupBy = 'day' } = req.query;
  const now = new Date();
  const start = from ? new Date(String(from)) : new Date(now.getFullYear(), now.getMonth(), 1);
  const end = to ? new Date(String(to) + 'T23:59:59.999Z') : new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  const { data: orders } = await supabase
    .from('orders')
    .select('id, status, total, createdAt, items:order_items(quantity, total, product:products(name, nameRu, cost)), payments:payments(method, amount)')
    .gte('createdAt', start.toISOString())
    .lte('createdAt', end.toISOString())
    .is('deletedAt', null);

  const allOrders = (orders || []) as Record<string, unknown>[];
  const completedOrders = allOrders.filter((o) => o.status === 'COMPLETED' || o.status === 'PAID');

  const byPeriod = new Map<string, { orders: number; sales: number; items: number }>();
  for (const o of completedOrders) {
    const d = new Date(o.createdAt as string);
    let key: string;
    if (groupBy === 'month') key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    else if (groupBy === 'week') {
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - d.getDay());
      key = weekStart.toISOString().split('T')[0];
    } else key = d.toISOString().split('T')[0];

    const existing = byPeriod.get(key) || { orders: 0, sales: 0, items: 0 };
    existing.orders++;
    existing.sales += Number(o.total || 0);
    existing.items += ((o.items || []) as Record<string, unknown>[]).reduce((s: number, i) => s + Number(i.quantity || 0), 0);
    byPeriod.set(key, existing);
  }

  const chart = Array.from(byPeriod.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, data]) => ({ date, ...data }));

  const totalSales = completedOrders.reduce((s, o) => s + Number(o.total || 0), 0);

  return json(res, {
    period: { from: start.toISOString(), to: end.toISOString(), groupBy },
    totalOrders: completedOrders.length,
    totalSales,
    chart,
  }, 200, origin);
}

async function handleProfit(req: VercelRequest, res: VercelResponse, origin: string | undefined) {
  const { start, end } = parseDateRange(req);

  const { data: orders } = await supabase
    .from('orders')
    .select('id, status, total, createdAt, items:order_items(quantity, total, productId, product:products(name, nameRu, cost, price))')
    .is('deletedAt', null);

  const allOrders = (orders || []) as Record<string, unknown>[];
  const dayOrders = allOrders.filter((o) => {
    const d = new Date(o.createdAt as string);
    return d >= start && d <= end;
  });

  const completedOrders = dayOrders.filter((o) => o.status === 'COMPLETED' || o.status === 'PAID');

  let totalRevenue = 0;
  let totalCost = 0;
  let totalItems = 0;

  const productProfit = new Map<string, { name: string; quantity: number; revenue: number; cost: number; profit: number }>();

  for (const o of completedOrders) {
    totalRevenue += Number(o.total || 0);
    for (const item of ((o.items || []) as Record<string, unknown>[])) {
      const qty = Number(item.quantity || 0);
      const revenue = Number(item.total || 0);
      const product = item.product as Record<string, unknown> | undefined;
      const unitCost = Number(product?.cost || 0);
      const itemCost = qty * unitCost;
      totalCost += itemCost;
      totalItems += qty;

      const key = item.productId as string;
      const existing = productProfit.get(key) || {
        name: (product?.nameRu as string) || (product?.name as string) || key.slice(0, 8),
        quantity: 0, revenue: 0, cost: 0, profit: 0,
      };
      existing.quantity += qty;
      existing.revenue += revenue;
      existing.cost += itemCost;
      existing.profit += revenue - itemCost;
      productProfit.set(key, existing);
    }
  }

  const topProducts = Array.from(productProfit.values())
    .sort((a, b) => b.profit - a.profit)
    .slice(0, 15);

  return json(res, {
    period: { from: start.toISOString(), to: end.toISOString() },
    totalRevenue,
    totalCost,
    totalProfit: totalRevenue - totalCost,
    profitMargin: totalRevenue > 0 ? Math.round(((totalRevenue - totalCost) / totalRevenue) * 100) : 0,
    totalItems,
    totalOrders: completedOrders.length,
    topProducts,
  }, 200, origin);
}
