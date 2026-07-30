import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase, json, error, corsPreflight, verifyToken } from '../lib/supabase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') return corsPreflight(res, req.headers.origin);
  const origin = req.headers.origin;
  const payload = verifyToken(req);
  if (!payload) return error(res, 'Unauthorized', 401, origin);

  const raw = req.query['...slug'];
  const slug: string[] = Array.isArray(raw) ? raw : (typeof raw === 'string' ? raw.split('/') : []);
  const entityPath = slug.join('/');

  if (entityPath === 'stations') {
    return handleStations(req, res, origin);
  }
  if (entityPath === 'tickets') {
    return handleTickets(req, res, origin);
  }
  if (entityPath.match(/^tickets\/[^/]+\/status$/)) {
    return handleTicketStatus(req, res, origin, slug[1]);
  }

  return error(res, `Unknown kitchen route: ${entityPath}`, 400, origin);
}

async function handleStations(req: VercelRequest, res: VercelResponse, origin: string | undefined) {
  if (req.method !== 'GET') return error(res, 'GET only', 405, origin);

  const { data, error: e } = await supabase
    .from('kitchen_stations')
    .select('*, printer:printers(id, name)')
    .eq('isActive', true)
    .is('deletedAt', null)
    .order('sortOrder', { ascending: true });

  if (e) return error(res, e.message, 500, origin);
  return json(res, { stations: data, items: data }, 200, origin);
}

async function handleTickets(req: VercelRequest, res: VercelResponse, origin: string | undefined) {
  if (req.method !== 'GET') return error(res, 'GET only', 405, origin);

  const { data, error: e } = await supabase
    .from('kitchen_tickets')
    .select(`
      *,
      order:orders!kitchen_tickets_orderId_fkey(id, orderNumber, notes, createdAt,
        items:order_items(id, quantity, note, status, product:products(id, name))
      ),
      station:kitchen_stations!kitchen_tickets_stationId_fkey(id, name)
    `)
    .in('status', ['NEW', 'ACCEPTED', 'PREPARING', 'READY'])
    .is('deletedAt', null)
    .order('createdAt', { ascending: true });

  if (e) return error(res, e.message, 500, origin);
  return json(res, { tickets: data, items: data }, 200, origin);
}

async function handleTicketStatus(req: VercelRequest, res: VercelResponse, origin: string | undefined, ticketId: string) {
  if (req.method !== 'PATCH') return error(res, 'PATCH only', 405, origin);
  const { status } = req.body;
  if (!status) return error(res, 'status required', 400, origin);

  const { data, error: e } = await supabase
    .from('kitchen_tickets')
    .update({ status, updatedAt: new Date().toISOString() })
    .eq('id', ticketId)
    .select('*')
    .single();

  if (e) return error(res, e.message, 500, origin);
  return json(res, data, 200, origin);
}
