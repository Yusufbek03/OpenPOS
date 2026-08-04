import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase, json, error, corsPreflight, verifyToken } from '../api-shared/supabase';

const ENTITY_TABLES: Record<string, string> = {
  customers: 'customers',
  suppliers: 'suppliers',
  printers: 'printers',
  kitchen: 'kitchen_stations',
  tables: 'restaurant_tables',
  'register-ops': 'register_ops',
  audit: 'audit_logs',
  inventory: 'inventory_items',
  companies: 'companies',
  users: 'users',
};

const ENTITY_SELECT: Record<string, string> = {
  printers: '*',
  kitchen: '*, printer:printers!kitchen_stations_printerId_fkey(id, name)',
  users: 'id, fullName, username, roleId, role:roles(name), pinCode, isActive, createdAt',
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') return corsPreflight(res, req.headers.origin);
  const origin = req.headers.origin;
  const payload = verifyToken(req);
  if (!payload) return error(res, 'Unauthorized', 401, origin);

  const raw = (req.query._path as string) || '';
  const path = decodeURIComponent(raw);
  const slug = path ? path.split('/').filter(Boolean) : [];
  const entityPath = slug.join('/');
  const baseEntity = slug[0] || '';
  const id = slug[slug.length - 1];

  if (!path) return json(res, { message: 'Admin API v1.0' }, 200, origin);

  if (entityPath === 'reports/dashboard') return handleDashboard(req, res, origin);
  if (entityPath === 'reports/clear-all') return handleClearAll(res, origin);
  if (entityPath === 'reports/daily') return handleDailyReport(req, res, origin);
  if (entityPath === 'reports/profit') return handleProfitReport(req, res, origin);
  if (entityPath === 'reports/period') return handlePeriodReport(req, res, origin);
  if (entityPath === 'shifts') return handleShifts(req, res, origin, payload);
  if (entityPath === 'audit') return handleAudit(req, res, origin);
  if (entityPath === 'register-ops') return handleRegisterOps(req, res, origin, payload);
  if (entityPath === 'inventory') return handleInventory(req, res, origin);
  if (entityPath === 'inventory/history') return handleInventoryHistory(req, res, origin);
  if (entityPath === 'inventory/receive') return handleInventoryReceive(req, res, origin);
  if (entityPath === 'inventory/writeoff') return handleInventoryWriteoff(req, res, origin);
  if (entityPath === 'customers/stats') return handleCustomerStats(res, origin);
  if (entityPath.match(/^customers\/[^/]+\/bonus\/(accrue|writeoff)$/)) {
    return handleCustomerBonus(req, res, origin, slug[1], slug[3] as 'accrue' | 'writeoff');
  }
  if (entityPath.match(/^printers\/[^/]+\/test$/)) {
    return handlePrinterTest(res, origin, slug[1]);
  }
  if (entityPath.match(/^tables\/[^/]+\/status$/)) {
    return handleTableStatus(req, res, origin, slug[1]);
  }
  if (entityPath === 'tables/zones') return handleTableZones(res, origin);
  if (entityPath === 'tables/stats') return handleTableStats(res, origin);
  if (entityPath === 'payments') return handlePayment(req, res, origin, payload);

  const table = ENTITY_TABLES[baseEntity];
  if (!table) return error(res, `Unknown entity: ${entityPath}`, 400, origin);

  const select = ENTITY_SELECT[baseEntity] || '*';

  if (req.method === 'GET' && slug.length >= 2 && !['stats', 'dashboard', 'zones'].includes(id)) {
    const recordId = slug[1];
    const { data, error: e } = await supabase.from(table).select(select).eq('id', recordId).single();
    if (e || !data) return error(res, `${baseEntity} not found`, 404, origin);
    return json(res, data, 200, origin);
  }

  if ((req.method === 'PATCH' || req.method === 'DELETE') && slug.length >= 2) {
    const recordId = slug[1];
    if (req.method === 'PATCH') {
      const { data, error: e } = await supabase.from(table).update(req.body).eq('id', recordId).select(select).single();
      if (e) return error(res, e.message, 500, origin);
      return json(res, data, 200, origin);
    }
    const { error: e } = await supabase.from(table).update({ deletedAt: new Date().toISOString() }).eq('id', recordId);
    if (e) return error(res, e.message, 500, origin);
    return json(res, { message: 'Deleted' }, 200, origin);
  }

  if (req.method === 'GET') {
    const { page = '1', limit = '50', search, sort, order = 'desc', ...filters } = req.query;
    const p = Math.max(1, Number(page));
    const l = Math.min(200, Math.max(1, Number(limit)));
    const offset = (p - 1) * l;

    const tablesWithoutSoftDelete = ['restaurant_tables', 'register_ops', 'inventory_items'];
    let query = supabase.from(table).select(select, { count: 'exact' });
    if (!tablesWithoutSoftDelete.includes(table)) {
      query = query.is('deletedAt', null);
    }

    if (baseEntity === 'customers') {
      if (search) { const s = String(search); query = query.or(`fullName.ilike.%${s}%,phone.ilike.%${s}%,email.ilike.%${s}%`); }
      if (filters.status) query = query.eq('status', filters.status);
    } else if (baseEntity === 'suppliers') {
      if (search) { const s = String(search); query = query.or(`name.ilike.%${s}%,inn.ilike.%${s}%,contactPerson.ilike.%${s}%`); }
    } else if (baseEntity === 'printers') {
      if (filters.department) query = query.eq('department', filters.department);
    } else if (baseEntity === 'users') {
      if (search) { const s = String(search); query = query.or(`fullName.ilike.%${s}%,username.ilike.%${s}%`); }
    }

    const sortCol = String(sort || 'createdAt');
    query = query.order(sortCol, { ascending: order === 'asc' });
    query = query.range(offset, offset + l - 1);

    const { data, error: e, count } = await query;
    if (e) return error(res, e.message, 500, origin);

    const responseKey = baseEntity === 'register-ops' ? 'ops' : baseEntity;
    return json(res, { [responseKey]: data, items: data, total: count, page: p, limit: l }, 200, origin);
  }

  if (req.method === 'POST') {
    const body = req.body;
    if (entityPath === 'customers') {
      if (!body.fullName) return error(res, 'fullName is required', 400, origin);
      body.status = body.status || 'NEW';
      body.bonusBalance = body.bonusBalance || 0;
      body.totalSpent = body.totalSpent || 0;
      body.totalOrders = body.totalOrders || 0;
    }
    if (entityPath === 'suppliers') {
      if (!body.name) return error(res, 'name is required', 400, origin);
    }
    if (entityPath === 'printers') {
      if (!body.name) return error(res, 'name is required', 400, origin);
      body.department = body.department || 'KITCHEN';
      body.type = body.type || 'RECEIPT';
      body.paperWidth = body.paperWidth || 80;
      body.isActive = body.isActive !== false;
    }
    if (baseEntity === 'kitchen') {
      if (!body.name) return error(res, 'name is required', 400, origin);
      body.sortOrder = body.sortOrder || 0;
      body.isActive = body.isActive !== 'false' && body.isActive !== false;
    }
    if (entityPath === 'tables') {
      if (!body.name) return error(res, 'name is required', 400, origin);
      body.status = body.status || 'FREE';
      body.isActive = body.isActive !== false;
      body.seats = body.seats || 4;
    }
    if (entityPath === 'users') {
      if (!body.fullName || !body.username) return error(res, 'fullName and username are required', 400, origin);
      body.role = body.role || 'CASHIER';
      body.isActive = body.isActive !== false;
    }
    if (entityPath === 'companies') {
      if (!body.name) return error(res, 'name is required', 400, origin);
    }

    const { data, error: e } = await supabase.from(table).insert(body).select(select).single();
    if (e) return error(res, e.message, 500, origin);
    return json(res, data, 201, origin);
  }

  return error(res, 'Method not allowed', 405, origin);
}

async function handleDashboard(req: VercelRequest, res: VercelResponse, origin: string | undefined) {
  const { from, to } = req.query;
  const today = new Date();
  const startOfDay = from ? new Date(String(from)) : new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endOfDay = to ? new Date(String(to) + 'T23:59:59.999Z') : new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);

  const { data: allOrders } = await supabase
    .from('orders')
    .select('id, status, total, createdAt, items:order_items(quantity, total, productId, product:products(id, name, nameRu))')
    .is('deletedAt', null);

  const allOrdersList = (allOrders || []) as Record<string, unknown>[];
  const dayOrders = allOrdersList.filter((o) => {
    const d = new Date(o.createdAt as string);
    return d >= startOfDay && d <= endOfDay;
  });

  const totalRevenue = allOrdersList.reduce((s, o) => s + Number(o.total || 0), 0);
  const dayRevenue = dayOrders.reduce((s, o) => s + Number(o.total || 0), 0);

  const productMap = new Map<string, { quantity: number; total: number }>();
  for (const order of allOrdersList) {
    for (const item of (order.items || []) as Record<string, unknown>[]) {
      const key = item.productId as string;
      const existing = productMap.get(key) || { quantity: 0, total: 0 };
      existing.quantity += Number(item.quantity || 0);
      existing.total += Number(item.total || 0);
      productMap.set(key, existing);
    }
  }
  const topProducts = Array.from(productMap.entries())
    .map(([productId, v]) => ({ productId, _sum: { quantity: v.quantity, total: v.total }, _count: 1 }))
    .sort((a, b) => b._sum.total - a._sum.total)
    .slice(0, 10);

  const activeStatuses = ['PENDING', 'SENT_TO_KITCHEN', 'PREPARING', 'READY'];
  const activeOrders = allOrdersList
    .filter((o) => activeStatuses.includes(o.status as string))
    .map((o) => ({ id: o.id, orderNumber: `ORD-${String(o.id).slice(0, 8)}`, status: o.status, createdAt: o.createdAt }))
    .slice(0, 20);

  return json(res, {
    totalOrders: allOrdersList.length, todayOrders: dayOrders.length,
    totalRevenue, todayRevenue: dayRevenue, topProducts, activeOrders, lowStock: [],
  }, 200, origin);
}

async function handleClearAll(res: VercelResponse, origin: string | undefined) {
  await supabase.from('orders').update({ deletedAt: new Date().toISOString() }).is('deletedAt', null);
  await supabase.from('order_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  return json(res, { message: 'All data cleared' }, 200, origin);
}

async function handleAudit(req: VercelRequest, res: VercelResponse, origin: string | undefined) {
  const { page = '1', limit = '50', entity, action, userId } = req.query;
  const p = Math.max(1, Number(page));
  const l = Math.min(200, Math.max(1, Number(limit)));
  const offset = (p - 1) * l;

  let query = supabase
    .from('audit_logs')
    .select('*, user:users!audit_logs_userId_fkey(id, fullName, username)', { count: 'exact' })
    .order('createdAt', { ascending: false });

  if (entity) query = query.eq('entity', entity);
  if (action) query = query.eq('action', action);
  if (userId) query = query.eq('userId', userId);
  query = query.range(offset, offset + l - 1);

  const { data, error: e, count } = await query;
  if (e) return error(res, e.message, 500, origin);
  return json(res, { logs: data, items: data, meta: { page: p, limit: l, total: count, pages: Math.ceil((count || 0) / l) } }, 200, origin);
}

async function handleRegisterOps(req: VercelRequest, res: VercelResponse, origin: string | undefined, payload: Record<string, unknown>) {
  if (req.method === 'GET') {
    const { data, error: e } = await supabase.from('register_ops').select('*').order('createdAt', { ascending: false });
    if (e) return error(res, e.message, 500, origin);
    return json(res, { ops: data, items: data }, 200, origin);
  }
  if (req.method === 'POST') {
    const { type, amount, reason } = req.body;
    if (!type || !amount) return error(res, 'type and amount required', 400, origin);
    const { data, error: e } = await supabase.from('register_ops').insert({ type, amount, reason: reason || '', userId: payload.sub }).select('*, user:users!register_ops_userId_fkey(fullName)').single();
    if (e) return error(res, e.message, 500, origin);
    return json(res, data, 201, origin);
  }
  return error(res, 'Method not allowed', 405, origin);
}

async function handleInventory(req: VercelRequest, res: VercelResponse, origin: string | undefined) {
  const { page = '1', limit = '200', lowStock } = req.query;
  const p = Math.max(1, Number(page));
  const l = Math.min(500, Math.max(1, Number(limit)));
  const offset = (p - 1) * l;

  let query = supabase.from('inventory_items').select('*, product:products(id, name, nameRu, sku)', { count: 'exact' });
  if (lowStock === 'true' || lowStock === '1') query = query.filter('quantity', 'lte', 'minStock');
  query = query.order('createdAt', { ascending: false }).range(offset, offset + l - 1);

  const { data, error: e, count } = await query;
  if (e) return error(res, e.message, 500, origin);
  return json(res, { items: data, total: count, page: p, limit: l }, 200, origin);
}

async function handleInventoryHistory(req: VercelRequest, res: VercelResponse, origin: string | undefined) {
  const { limit = '100' } = req.query;
  const l = Math.min(500, Math.max(1, Number(limit)));
  const { data, error: e } = await supabase.from('inventory_history').select('*, product:products(id, name, sku), user:users(id, fullName)').order('createdAt', { ascending: false }).limit(l);
  if (e) return error(res, e.message, 500, origin);
  return json(res, { items: data, history: data }, 200, origin);
}

async function handleInventoryReceive(req: VercelRequest, res: VercelResponse, origin: string | undefined) {
  if (req.method !== 'POST') return error(res, 'POST only', 405, origin);
  const { productId, quantity, notes } = req.body;
  if (!productId || !quantity) return error(res, 'productId and quantity required', 400, origin);
  const { data: existing } = await supabase.from('inventory_items').select('id, quantity').eq('productId', productId).is('deletedAt', null).single();
  if (existing) {
    await supabase.from('inventory_items').update({ quantity: Number(existing.quantity) + Number(quantity), lastReceivedAt: new Date().toISOString() }).eq('id', existing.id);
  } else {
    await supabase.from('inventory_items').insert({ productId, quantity, minStock: 0 });
  }
  await supabase.from('inventory_history').insert({ productId, type: 'RECEIVE', quantity, notes: notes || '' });
  return json(res, { message: 'Inventory received', productId, quantity }, 200, origin);
}

async function handleInventoryWriteoff(req: VercelRequest, res: VercelResponse, origin: string | undefined) {
  if (req.method !== 'POST') return error(res, 'POST only', 405, origin);
  const { productId, quantity, reason, notes } = req.body;
  if (!productId || !quantity) return error(res, 'productId and quantity required', 400, origin);
  const { data: existing } = await supabase.from('inventory_items').select('id, quantity').eq('productId', productId).is('deletedAt', null).single();
  if (!existing) return error(res, 'Product not found in inventory', 404, origin);
  const newQty = Number(existing.quantity) - Number(quantity);
  if (newQty < 0) return error(res, 'Insufficient inventory', 400, origin);
  await supabase.from('inventory_items').update({ quantity: newQty }).eq('id', existing.id);
  await supabase.from('inventory_history').insert({ productId, type: 'WRITEOFF', quantity: -Number(quantity), reason: reason || '', notes: notes || '' });
  return json(res, { message: 'Inventory written off', productId, quantity }, 200, origin);
}

async function handleCustomerStats(res: VercelResponse, origin: string | undefined) {
  const { data: customers } = await supabase.from('customers').select('id, status, bonusBalance').is('deletedAt', null);
  const list = (customers || []) as Array<{ id: string; status: string; bonusBalance: string | number }>;
  const total = list.length;
  const byStatus: Record<string, number> = {};
  let totalBonusBalance = 0;
  for (const c of list) { byStatus[c.status] = (byStatus[c.status] || 0) + 1; totalBonusBalance += Number(c.bonusBalance || 0); }
  return json(res, { total, byStatus, totalBonusBalance }, 200, origin);
}

async function handleCustomerBonus(req: VercelRequest, res: VercelResponse, origin: string | undefined, id: string, type: 'accrue' | 'writeoff') {
  if (req.method !== 'POST') return error(res, 'POST only', 405, origin);
  const { amount } = req.body;
  if (!amount || amount <= 0) return error(res, 'amount required', 400, origin);
  const { data: customer, error: e1 } = await supabase.from('customers').select('bonusBalance').eq('id', id).single();
  if (e1 || !customer) return error(res, 'Customer not found', 404, origin);
  const currentBalance = Number(customer.bonusBalance || 0);
  const newBalance = type === 'accrue' ? currentBalance + Number(amount) : currentBalance - Number(amount);
  if (newBalance < 0) return error(res, 'Insufficient bonus balance', 400, origin);
  const { data, error: e } = await supabase.from('customers').update({ bonusBalance: newBalance }).eq('id', id).select('*').single();
  if (e) return error(res, e.message, 500, origin);
  return json(res, data, 200, origin);
}

async function handlePrinterTest(res: VercelResponse, origin: string | undefined, id: string) {
  const { data: printer, error: e } = await supabase.from('printers').select('ipAddress, port').eq('id', id).single();
  if (e || !printer) return error(res, 'Printer not found', 404, origin);
  return json(res, { connected: false, message: 'Printer test not available in serverless mode' }, 200, origin);
}

async function handleTableStatus(req: VercelRequest, res: VercelResponse, origin: string | undefined, id: string) {
  if (req.method !== 'PATCH') return error(res, 'PATCH only', 405, origin);
  const { status, waiterId } = req.body;
  const updateData: Record<string, unknown> = {};
  if (status) updateData.status = status;
  if (waiterId !== undefined) updateData.waiterId = waiterId;
  const { data, error: e } = await supabase.from('restaurant_tables').update(updateData).eq('id', id).select('*').single();
  if (e) return error(res, e.message, 500, origin);
  return json(res, data, 200, origin);
}

async function handleTableZones(res: VercelResponse, origin: string | undefined) {
  const { data, error: e } = await supabase.from('restaurant_tables').select('zone').is('deletedAt', null);
  if (e) return error(res, e.message, 500, origin);
  const zones = Array.from(new Set((data || []).map((r: { zone: string }) => r.zone).filter(Boolean)));
  return json(res, zones, 200, origin);
}

async function handleTableStats(res: VercelResponse, origin: string | undefined) {
  const { data, error: e } = await supabase.from('restaurant_tables').select('status').is('deletedAt', null);
  if (e) return error(res, e.message, 500, origin);
  const stats: Record<string, number> = {};
  for (const row of (data || []) as Array<{ status: string }>) { stats[row.status] = (stats[row.status] || 0) + 1; }
  return json(res, stats, 200, origin);
}

async function handlePayment(req: VercelRequest, res: VercelResponse, origin: string | undefined, payload: any) {
  if (req.method !== 'POST') return error(res, 'POST only', 405, origin);
  const { orderId, method, amount } = req.body;
  if (!orderId || !method || !amount) return error(res, 'orderId, method, amount обязательны', 400, origin);

  const { data: payment, error: e } = await supabase.from('payments').insert({
    orderId, method, amount, status: 'COMPLETED', processedBy: payload.sub,
  }).select().single();
  if (e) return error(res, e.message, 500, origin);

  const { data: orderPayments } = await supabase.from('payments').select('amount').eq('orderId', orderId);
  const totalPaid = (orderPayments || []).reduce((s: number, p: any) => s + Number(p.amount), 0);
  const { data: order } = await supabase.from('orders').select('total').eq('id', orderId).single();
  const orderTotal = order?.total || 0;

  let orderStatus = 'PARTIALLY_PAID';
  if (totalPaid >= orderTotal) orderStatus = 'PAID';

  await supabase.from('orders').update({ status: orderStatus, paidAt: orderStatus === 'PAID' ? new Date().toISOString() : null }).eq('id', orderId);

  return json(res, { ...payment, orderStatus, totalPaid }, 201, origin);
}

async function handleDailyReport(req: VercelRequest, res: VercelResponse, origin: string | undefined) {
  const { from, to } = req.query;
  const now = new Date();
  const start = from ? new Date(String(from)) : new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = to ? new Date(String(to) + 'T23:59:59.999Z') : new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  const { data: orders } = await supabase
    .from('orders')
    .select('id, status, total, discount, tax, createdAt, items:order_items(quantity, total, product:products(name, nameRu, cost)), payments:payments(method, amount)')
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

  const methodLabels: Record<string, string> = { CASH: 'Наличные', CARD: 'Карта', CLICK: 'Click', PAYME: 'Payme', UZUM_BANK: 'Uzum Bank' };
  const paymentBreakdown = Object.entries(paymentMethods).map(([method, amount]) => ({
    method, label: methodLabels[method] || method, amount,
    percentage: totalSales > 0 ? Math.round((amount / totalSales) * 100) : 0,
  }));

  return json(res, {
    period: { from: start.toISOString(), to: end.toISOString() },
    totalOrders: completedOrders.length, totalSales, totalDiscount, totalTax, totalItems,
    avgCheck: completedOrders.length > 0 ? Math.round(totalSales / completedOrders.length) : 0,
    paymentBreakdown,
  }, 200, origin);
}

async function handleProfitReport(req: VercelRequest, res: VercelResponse, origin: string | undefined) {
  const { from, to } = req.query;
  const now = new Date();
  const start = from ? new Date(String(from)) : new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = to ? new Date(String(to) + 'T23:59:59.999Z') : new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

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
      totalCost += qty * unitCost;
      totalItems += qty;

      const key = item.productId as string;
      const existing = productProfit.get(key) || {
        name: (product?.nameRu as string) || (product?.name as string) || key.slice(0, 8),
        quantity: 0, revenue: 0, cost: 0, profit: 0,
      };
      existing.quantity += qty;
      existing.revenue += revenue;
      existing.cost += qty * unitCost;
      existing.profit += revenue - qty * unitCost;
      productProfit.set(key, existing);
    }
  }

  const topProducts = Array.from(productProfit.values()).sort((a, b) => b.profit - a.profit).slice(0, 15);

  return json(res, {
    period: { from: start.toISOString(), to: end.toISOString() },
    totalRevenue, totalCost, totalProfit: totalRevenue - totalCost,
    profitMargin: totalRevenue > 0 ? Math.round(((totalRevenue - totalCost) / totalRevenue) * 100) : 0,
    totalItems, totalOrders: completedOrders.length, topProducts,
  }, 200, origin);
}

async function handlePeriodReport(req: VercelRequest, res: VercelResponse, origin: string | undefined) {
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

  const chart = Array.from(byPeriod.entries()).sort(([a], [b]) => a.localeCompare(b)).map(([date, data]) => ({ date, ...data }));
  const totalSales = completedOrders.reduce((s, o) => s + Number(o.total || 0), 0);

  return json(res, {
    period: { from: start.toISOString(), to: end.toISOString(), groupBy },
    totalOrders: completedOrders.length, totalSales, chart,
  }, 200, origin);
}

async function handleShifts(req: VercelRequest, res: VercelResponse, origin: string | undefined, payload: Record<string, unknown>) {
  if (req.method === 'GET') {
    const { action } = req.query;

    if (action === 'current') {
      const { data, error: e } = await supabase
        .from('shifts').select('*')
        .eq('cashierId', payload.sub).eq('status', 'OPEN')
        .order('openedAt', { ascending: false }).limit(1).maybeSingle();
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
        .eq('cashierId', shift.cashierId).gte('createdAt', shift.openedAt)
        .lte('createdAt', shift.closedAt || new Date().toISOString()).is('deletedAt', null);
      const orderList = (orders || []) as Record<string, unknown>[];
      const completedOrders = orderList.filter((o) => o.status === 'COMPLETED' || o.status === 'PAID');
      const totalSales = completedOrders.reduce((s, o) => s + Number(o.total || 0), 0);
      const paymentMethods: Record<string, number> = {};
      for (const o of completedOrders) {
        for (const p of ((o.payments || []) as Record<string, unknown>[])) {
          const method = (p.method as string) || 'UNKNOWN';
          paymentMethods[method] = (paymentMethods[method] || 0) + Number(p.amount || 0);
        }
      }
      return json(res, { shift, report: { totalSales, totalOrders: completedOrders.length, paymentMethods,
        cashBalance: shift.closingBalance != null ? shift.closingBalance - shift.openingBalance : null } }, 200, origin);
    }

    if (action === 'list') {
      const { page = '1', limit = '20' } = req.query;
      const p = Math.max(1, Number(page));
      const l = Math.min(100, Math.max(1, Number(limit)));
      const offset = (p - 1) * l;
      let query = supabase.from('shifts').select('*, cashier:users!shifts_cashierId_fkey(id, fullName, username)', { count: 'exact' }).order('openedAt', { ascending: false });
      if (payload.role !== 'OWNER' && payload.role !== 'ADMINISTRATOR') query = query.eq('cashierId', payload.sub);
      query = query.range(offset, offset + l - 1);
      const { data, error: e, count } = await query;
      if (e) return error(res, e.message, 500, origin);
      return json(res, { shifts: data, items: data, total: count, page: p, limit: l }, 200, origin);
    }

    return error(res, 'Unknown action', 400, origin);
  }

  if (req.method === 'POST') {
    const { action } = req.body;

    if (action === 'open') {
      const { openingBalance = 0 } = req.body;
      const { data: existing } = await supabase.from('shifts').select('id').eq('cashierId', payload.sub).eq('status', 'OPEN').limit(1);
      if (existing && existing.length > 0) return error(res, 'Уже есть открытая смена', 400, origin);
      const { data, error: e } = await supabase.from('shifts').insert({
        cashierId: payload.sub, branchId: payload.branchId || 'c0000001-0000-0000-0000-000000000001',
        openingBalance: Number(openingBalance), status: 'OPEN',
      }).select().single();
      if (e) return error(res, e.message, 500, origin);
      return json(res, { shift: data, message: 'Смена открыта' }, 201, origin);
    }

    if (action === 'close') {
      const { shiftId, cashCount, notes } = req.body;
      if (!shiftId) return error(res, 'shiftId required', 400, origin);
      const { data: shift, error: e1 } = await supabase.from('shifts').select('*').eq('id', shiftId).eq('status', 'OPEN').single();
      if (e1 || !shift) return error(res, 'Открытая смена не найдена', 404, origin);
      const { data: orders } = await supabase
        .from('orders').select('id, total, payments:payments(method, amount)')
        .eq('cashierId', shift.cashierId).gte('createdAt', shift.openedAt).is('deletedAt', null);
      const orderList = (orders || []) as Record<string, unknown>[];
      const completedOrders = orderList.filter((o) => {
        const status = o.status || 'COMPLETED';
        return status === 'COMPLETED' || status === 'PAID' || status === 'PENDING';
      });
      let totalSales = 0, totalCash = 0, totalCard = 0, totalOther = 0;
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
      const { data, error: e } = await supabase.from('shifts').update({
        status: 'CLOSED', closedAt: new Date().toISOString(),
        closingBalance: cashCount != null ? Number(cashCount) : null,
        cashCount: cashCount != null ? Number(cashCount) : null,
        totalSales, totalCash, totalCard, totalOther, totalOrders: completedOrders.length,
        notes: notes || null, updatedAt: new Date().toISOString(),
      }).eq('id', shiftId).select().single();
      if (e) return error(res, e.message, 500, origin);
      return json(res, { shift: data, report: {
        totalSales, totalOrders: completedOrders.length, totalCash, totalCard, totalOther,
        expectedCash: shift.openingBalance + totalCash,
        actualCash: cashCount != null ? Number(cashCount) : null,
        difference: cashCount != null ? Number(cashCount) - (shift.openingBalance + totalCash) : null,
      }, message: 'Смена закрыта' }, 200, origin);
    }

    return error(res, 'Unknown action', 400, origin);
  }

  return error(res, 'Method not allowed', 405, origin);
}
