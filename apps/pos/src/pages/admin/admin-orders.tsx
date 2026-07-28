import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Search, ChevronDown, ChevronUp, RotateCcw, X, Download, FileSpreadsheet } from 'lucide-react';

interface Order {
  id: string; orderNumber: string; status: string; subtotal: string; discount: string; total: string;
  createdAt: string; notes: string | null;
  cashier: { fullName: string } | null;
  customer: { fullName: string } | null;
  items: { id: string; quantity: string; unitPrice: string; discount: string; total: string; note: string | null; product: { name: string; nameRu: string } }[];
  payments: { method: string; amount: string; status: string }[];
}

const STATUS_FILTERS = ['ALL', 'DRAFT', 'SENT_TO_KITCHEN', 'COMPLETED', 'CANCELLED', 'RETURNED'];
const STATUS_LABELS: Record<string, string> = { ALL: 'Все', DRAFT: 'Черновик', SENT_TO_KITCHEN: 'На кухне', COMPLETED: 'Выполнен', CANCELLED: 'Отменён', RETURNED: 'Возврат' };
const STATUS_COLORS: Record<string, { bg: string; fg: string }> = {
  COMPLETED: { bg: '#DCFCE7', fg: '#16A34A' },
  SENT_TO_KITCHEN: { bg: '#FEF9C3', fg: '#A16207' },
  CANCELLED: { bg: '#FEE2E2', fg: '#DC2626' },
  RETURNED: { bg: '#F3E8FF', fg: '#8B5CF6' },
  DRAFT: { bg: '#F3F4F6', fg: '#374151' },
};

const pageStyle: React.CSSProperties = { padding: 24, display: 'flex', flexDirection: 'column', gap: 20 };
const cardStyle: React.CSSProperties = { background: '#FFFFFF', borderRadius: 16, border: '1px solid #E5E7EB', overflow: 'hidden' };
const inputStyle: React.CSSProperties = { width: '100%', height: 40, padding: '0 12px', borderRadius: 10, border: '1px solid #E5E7EB', fontSize: 14, boxSizing: 'border-box', outline: 'none' };
const thStyle: React.CSSProperties = { padding: '12px 12px', textAlign: 'left', fontSize: 13, color: '#6B7280', borderBottom: '1px solid #E5E7EB', fontWeight: 500 };
const tdStyle: React.CSSProperties = { padding: '12px', fontSize: 14, borderBottom: '1px solid #F3F4F6' };

export function AdminOrders() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState('ALL');
  const [search, setSearch] = useState('');
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [returnModal, setReturnModal] = useState<string | null>(null);
  const [returnReason, setReturnReason] = useState('');

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['admin-orders', status, search],
    queryFn: async () => {
      const { data } = await api.get('/orders', { params: { limit: 200, status: status === 'ALL' ? undefined : status, search: search || undefined } });
      return data.orders as Order[];
    },
  });

  const returnOrder = useMutation({
    mutationFn: async (orderId: string) => {
      return api.post(`/orders/${orderId}/return`, { reason: returnReason || undefined });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      setReturnModal(null);
      setReturnReason('');
    },
  });

  return (
    <div style={pageStyle}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>Заказы</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <a href={`${api.defaults.baseURL}/export/orders/csv${status !== 'ALL' ? `?status=${status}` : ''}`} target="_blank" rel="noopener"
            style={{ height: 36, padding: '0 14px', borderRadius: 10, border: '1px solid #E5E7EB', background: '#FFFFFF', color: '#374151', fontSize: 13, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}>
            <Download style={{ width: 14, height: 14 }} /> CSV
          </a>
          <a href={`${api.defaults.baseURL}/export/orders/excel${status !== 'ALL' ? `?status=${status}` : ''}`} target="_blank" rel="noopener"
            style={{ height: 36, padding: '0 14px', borderRadius: 10, border: '1px solid #E5E7EB', background: '#FFFFFF', color: '#374151', fontSize: 13, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}>
            <FileSpreadsheet style={{ width: 14, height: 14 }} /> Excel
          </a>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 384 }}>
          <Search style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: '#9CA3AF', pointerEvents: 'none' }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Поиск по номеру..." style={{ ...inputStyle, paddingLeft: 36 }} />
        </div>
        <div style={{ display: 'flex', gap: 4, background: '#F3F4F6', borderRadius: 10, padding: 4, flexWrap: 'wrap' }}>
          {STATUS_FILTERS.map((s) => (
            <button key={s} onClick={() => setStatus(s)} style={{
              padding: '6px 12px', borderRadius: 8, fontSize: 13, fontWeight: 500, border: 'none', cursor: 'pointer',
              background: status === s ? '#FFFFFF' : 'transparent', color: status === s ? '#111827' : '#6B7280',
              boxShadow: status === s ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            }}>
              {STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      {returnModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)' }}>
          <div style={{ background: '#FFFFFF', borderRadius: 16, width: '100%', maxWidth: 400, margin: '0 16px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #E5E7EB' }}>
              <h2 style={{ fontSize: 16, fontWeight: 600 }}>🔄 Возврат заказа</h2>
              <button onClick={() => { setReturnModal(null); setReturnReason(''); }} style={{ padding: 4, background: 'none', border: 'none', cursor: 'pointer' }}><X style={{ width: 20, height: 20 }} /></button>
            </div>
            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <p style={{ fontSize: 13, color: '#6B7280' }}>Возврат вернёт товары на склад и создаст платёж-возврат. Отменить действие будет невозможно.</p>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>Причина возврата</label>
                <input value={returnReason} onChange={(e) => setReturnReason(e.target.value)} style={inputStyle} placeholder="Необязательно" />
              </div>
              <button onClick={() => returnOrder.mutate(returnModal)} disabled={returnOrder.isPending}
                style={{ width: '100%', height: 44, borderRadius: 10, border: 'none', background: '#EF4444', color: '#FFFFFF', fontWeight: 600, fontSize: 14, cursor: 'pointer', opacity: returnOrder.isPending ? 0.6 : 1 }}>
                {returnOrder.isPending ? 'Обработка...' : 'Подтвердить возврат'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={cardStyle}>
        {isLoading ? (
          <div style={{ padding: 32, textAlign: 'center', color: '#6B7280' }}>Загрузка...</div>
        ) : orders.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', color: '#6B7280' }}>Нет заказов</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={thStyle}>Номер</th>
                <th style={thStyle}>Кассир</th>
                <th style={thStyle}>Товары</th>
                <th style={thStyle}>Скидка</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Сумма</th>
                <th style={thStyle}>Оплата</th>
                <th style={thStyle}>Статус</th>
                <th style={thStyle}>Время</th>
                <th style={{ ...thStyle, width: 40 }}></th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => {
                const st = STATUS_COLORS[o.status] || { bg: '#F3F4F6', fg: '#374151' };
                return (
                  <>
                    <tr key={o.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                      <td style={tdStyle}>{o.orderNumber}</td>
                      <td style={tdStyle}>{o.cashier?.fullName || '—'}</td>
                      <td style={tdStyle}>{o.items.length} товаров</td>
                      <td style={{ ...tdStyle, color: Number(o.discount) > 0 ? '#EF4444' : '#6B7280' }}>
                        {Number(o.discount) > 0 ? `-${Number(o.discount).toLocaleString('uz-UZ')}` : '—'}
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 500 }}>{Number(o.total).toLocaleString('uz-UZ')} сўм</td>
                      <td style={{ ...tdStyle, fontSize: 13, color: '#6B7280' }}>{o.payments.map((p) => `${p.method}: ${Number(p.amount).toLocaleString('uz-UZ')}`).join(', ') || '—'}</td>
                      <td style={tdStyle}>
                        <span style={{ fontSize: 12, padding: '4px 10px', borderRadius: 20, fontWeight: 500, background: st.bg, color: st.fg }}>{STATUS_LABELS[o.status] || o.status}</span>
                      </td>
                      <td style={{ ...tdStyle, fontSize: 13, color: '#6B7280' }}>{new Date(o.createdAt).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}</td>
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', gap: 2 }}>
                          {o.status === 'COMPLETED' && (
                            <button onClick={() => setReturnModal(o.id)} title="Возврат" style={{ padding: 4, background: 'none', border: 'none', cursor: 'pointer', borderRadius: 6, color: '#8B5CF6' }}><RotateCcw style={{ width: 16, height: 16 }} /></button>
                          )}
                          <button onClick={() => setExpandedOrder(expandedOrder === o.id ? null : o.id)} style={{ padding: 4, background: 'none', border: 'none', cursor: 'pointer', borderRadius: 6 }}>
                            {expandedOrder === o.id ? <ChevronUp style={{ width: 16, height: 16, color: '#6B7280' }} /> : <ChevronDown style={{ width: 16, height: 16, color: '#6B7280' }} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                    {expandedOrder === o.id && (
                      <tr key={`${o.id}-detail`}>
                        <td colSpan={9} style={{ padding: '0 16px 16px', background: '#F9FAFB' }}>
                          <div style={{ padding: '12px 0', display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {o.customer && <p style={{ fontSize: 13, color: '#6B7280' }}>Клиент: <strong>{o.customer.fullName}</strong></p>}
                            {o.notes && <p style={{ fontSize: 13, color: '#6B7280' }}>Заметка: {o.notes}</p>}
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                              <thead>
                                <tr>
                                  <th style={{ padding: '6px 8px', textAlign: 'left', fontSize: 12, color: '#9CA3AF' }}>Товар</th>
                                  <th style={{ padding: '6px 8px', textAlign: 'right', fontSize: 12, color: '#9CA3AF' }}>Цена</th>
                                  <th style={{ padding: '6px 8px', textAlign: 'right', fontSize: 12, color: '#9CA3AF' }}>Кол-во</th>
                                  <th style={{ padding: '6px 8px', textAlign: 'right', fontSize: 12, color: '#9CA3AF' }}>Итого</th>
                                </tr>
                              </thead>
                              <tbody>
                                {o.items.map((item) => (
                                  <tr key={item.id}>
                                    <td style={{ padding: '6px 8px', fontSize: 13 }}>{item.product.nameRu}</td>
                                    <td style={{ padding: '6px 8px', fontSize: 13, textAlign: 'right' }}>{Number(item.unitPrice).toLocaleString('uz-UZ')}</td>
                                    <td style={{ padding: '6px 8px', fontSize: 13, textAlign: 'right' }}>×{Number(item.quantity)}</td>
                                    <td style={{ padding: '6px 8px', fontSize: 13, textAlign: 'right', fontWeight: 500 }}>{Number(item.total).toLocaleString('uz-UZ')} сўм</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, paddingTop: 8, borderTop: '1px solid #E5E7EB' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                                <span style={{ color: '#6B7280' }}>Подытог</span><span>{Number(o.subtotal).toLocaleString('uz-UZ')} сўм</span>
                              </div>
                              {Number(o.discount) > 0 && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#EF4444' }}>
                                  <span>Скидка</span><span>-{Number(o.discount).toLocaleString('uz-UZ')} сўм</span>
                                </div>
                              )}
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 700 }}>
                                <span>Итого</span><span style={{ color: '#2563EB' }}>{Number(o.total).toLocaleString('uz-UZ')} сўм</span>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
