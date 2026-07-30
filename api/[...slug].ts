import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase, json, error, corsPreflight, verifyToken } from './lib/supabase';

const ENTITY_TABLES: Record<string, string> = {
  customers: 'customers',
  suppliers: 'suppliers',
  printers: 'printers',
  'kitchen/stations': 'kitchen_stations',
  tables: 'restaurant_tables',
  'register-ops': 'register_ops',
  audit: 'audit_logs',
  'reports/dashboard': '__dashboard__',
};

const ENTITY_SELECT: Record<string, string> = {
  printers: '*',
  'kitchen/stations': '*, printer:printers(id, name)',
  tables: '*, waiter:users!restaurant_tables_waiterId_fkey(id, fullName), orders:orders(id, orderNumber, total, status, deletedAt)',
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') return corsPreflight(res, req.headers.origin);
  const origin = req.headers.origin;
  const payload = verifyToken(req);
  if (!payload) return error(res, 'Unauthorized', 401, origin);

  const raw = req.query['...slug'];
  const slug: string[] = Array.isArray(raw) ? raw : (typeof raw === 'string' ? raw.split('/') : []);

  const entityPath = slug.join('/');
  const id = slug[slug.length - 1];

  if (entityPath === 'reports/dashboard') {
    return handleDashboard(req, res, origin);
  }
  if (entityPath === 'audit') {
    return handleAudit(req, res, origin);
  }
  if (entityPath === 'register-ops') {
    return handleRegisterOps(req, res, origin, payload);
  }
  if (entityPath === 'customers' && slug.includes('stats')) {
    return handleCustomerStats(res, origin);
  }
  if (entityPath.match(/^customers\/[^/]+\/bonus\/(accrue|writeoff)$/)) {
    const customerId = slug[1];
    const bonusType = slug[3] as 'accrue' | 'writeoff';
    return handleCustomerBonus(req, res, origin, customerId, bonusType);
  }
  if (entityPath.match(/^printers\/[^/]+\/test$/)) {
    return handlePrinterTest(res, origin, slug[1]);
  }
  if (entityPath.match(/^tables\/[^/]+\/status$/)) {
    return handleTableStatus(req, res, origin, slug[1]);
  }
  if (entityPath.match(/^tables\/zones$/)) {
    return handleTableZones(res, origin);
  }
  if (entityPath.match(/^tables\/stats$/)) {
    return handleTableStats(res, origin);
  }

  const table = ENTITY_TABLES[entityPath];
  if (!table) return error(res, `Unknown entity: ${entityPath}`, 400, origin);

  const select = ENTITY_SELECT[entityPath] || '*';

  if (req.method === 'GET' && slug.length >= 2 && !['stats', 'dashboard', 'zones'].includes(id)) {
    const recordId = slug[1];
    const { data, error: e } = await supabase.from(table).select(select).eq('id', recordId).single();
    if (e || !data) return error(res, `${entityPath} not found`, 404, origin);
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

    let query = supabase.from(table).select(select, { count: 'exact' }).is('deletedAt', null);

    if (entityPath === 'customers') {
      if (search) { const s = String(search); query = query.or(`fullName.ilike.%${s}%,phone.ilike.%${s}%,email.ilike.%${s}%`); }
      if (filters.status) query = query.eq('status', filters.status);
    } else if (entityPath === 'suppliers') {
      if (search) { const s = String(search); query = query.or(`name.ilike.%${s}%,inn.ilike.%${s}%,contactPerson.ilike.%${s}%`); }
    } else if (entityPath === 'printers') {
      if (filters.department) query = query.eq('department', filters.department);
    } else if (entityPath === 'audit') {
      if (filters.entity) query = query.eq('entity', filters.entity);
      if (filters.action) query = query.eq('action', filters.action);
      if (filters.userId) query = query.eq('userId', filters.userId);
    }

    const sortCol = String(sort || 'createdAt');
    query = query.order(sortCol, { ascending: order === 'asc' });
    query = query.range(offset, offset + l - 1);

    const { data, error: e, count } = await query;
    if (e) return error(res, e.message, 500, origin);

    const responseKey = entityPath === 'register-ops' ? 'ops' : entityPath;
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
    if (entityPath === 'kitchen/stations') {
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allOrdersList = (allOrders || []) as any[];

  const dayOrders = allOrdersList.filter((o: any) => {
    const d = new Date(o.createdAt);
    return d >= startOfDay && d <= endOfDay;
  });

  const totalRevenue = allOrdersList.reduce((s: number, o: any) => s + Number(o.total || 0), 0);
  const dayRevenue = dayOrders.reduce((s: number, o: any) => s + Number(o.total || 0), 0);

  const productMap = new Map<string, { quantity: number; total: number }>();
  for (const order of allOrdersList) {
    for (const item of order.items || []) {
      const key = item.productId;
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
    .filter((o: any) => activeStatuses.includes(o.status))
    .map((o: any) => ({ id: o.id, orderNumber: `ORD-${String(o.id).slice(0, 8)}`, status: o.status, createdAt: o.createdAt }))
    .slice(0, 20);

  return json(res, {
    totalOrders: allOrdersList.length,
    todayOrders: dayOrders.length,
    totalRevenue,
    todayRevenue: dayRevenue,
    topProducts,
    activeOrders,
    lowStock: [],
  }, 200, origin);
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
    const { data, error: e } = await supabase
      .from('register_ops')
      .select('*, user:users!register_ops_userId_fkey(fullName)')
      .order('createdAt', { ascending: false });
    if (e) return error(res, e.message, 500, origin);
    return json(res, { ops: data, items: data }, 200, origin);
  }

  if (req.method === 'POST') {
    const { type, amount, reason } = req.body;
    if (!type || !amount) return error(res, 'type and amount required', 400, origin);
    const { data, error: e } = await supabase
      .from('register_ops')
      .insert({ type, amount, reason: reason || '', userId: payload.sub })
      .select('*, user:users!register_ops_userId_fkey(fullName)')
      .single();
    if (e) return error(res, e.message, 500, origin);
    return json(res, data, 201, origin);
  }

  return error(res, 'Method not allowed', 405, origin);
}

async function handleCustomerStats(res: VercelResponse, origin: string | undefined) {
  const { data: customers } = await supabase
    .from('customers')
    .select('id, status, bonusBalance')
    .is('deletedAt', null);

  const list = (customers || []) as Array<{ id: string; status: string; bonusBalance: string | number }>;
  const total = list.length;
  const byStatus: Record<string, number> = {};
  let totalBonusBalance = 0;
  for (const c of list) {
    byStatus[c.status] = (byStatus[c.status] || 0) + 1;
    totalBonusBalance += Number(c.bonusBalance || 0);
  }

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
  for (const row of (data || []) as Array<{ status: string }>) {
    stats[row.status] = (stats[row.status] || 0) + 1;
  }
  return json(res, stats, 200, origin);
}
