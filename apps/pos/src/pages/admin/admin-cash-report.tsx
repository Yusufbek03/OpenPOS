import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { DollarSign, CreditCard, Smartphone, ArrowDownCircle, ArrowUpCircle, Plus, X, Lock, AlertTriangle, Calendar, TrendingUp, ShoppingCart } from 'lucide-react';

interface PaymentByMethod {
  _sum: { amount: string | number } | null;
  _count: number;
  method: string;
}

interface DashboardData {
  totalOrders: number; dayOrders: number;
  totalRevenue: string | number; dayRevenue: string | number;
  dayPayments: PaymentByMethod[];
}

interface RegisterOp {
  id: string; type: 'CASH_IN' | 'CASH_OUT'; amount: number; reason: string; createdAt: string; user: { fullName: string };
}

const pageStyle: React.CSSProperties = { padding: 24, display: 'flex', flexDirection: 'column', gap: 24 };
const cardStyle: React.CSSProperties = { background: '#FFFFFF', borderRadius: 16, border: '1px solid #E5E7EB', padding: 20 };
const inputStyle: React.CSSProperties = { width: '100%', height: 40, padding: '0 12px', borderRadius: 10, border: '1px solid #E5E7EB', fontSize: 14, boxSizing: 'border-box', outline: 'none' };
const labelStyle: React.CSSProperties = { display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 };
const btnPrimary: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#2563EB', color: '#FFFFFF', borderRadius: 10, border: 'none', fontSize: 14, fontWeight: 500, cursor: 'pointer' };

export function AdminCashReport() {
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [showOp, setShowOp] = useState(false);
  const [showClose, setShowClose] = useState(false);
  const [opForm, setOpForm] = useState<{ type: 'CASH_IN' | 'CASH_OUT'; amount: string; reason: string }>({ type: 'CASH_IN', amount: '', reason: '' });

  const { data: dashboard } = useQuery({
    queryKey: ['cash-dashboard', selectedDate],
    queryFn: async () => {
      const { data } = await api.get('/reports/dashboard', { params: { from: selectedDate, to: selectedDate } });
      return data as DashboardData;
    },
  });

  const { data: registerOps = [] } = useQuery({
    queryKey: ['register-ops', selectedDate],
    queryFn: async () => {
      try {
        const { data } = await api.get('/register-ops');
        const all = data as RegisterOp[];
        return all.filter((op) => op.createdAt.slice(0, 10) === selectedDate);
      } catch {
        return [] as RegisterOp[];
      }
    },
  });

  const { data: openOrdersData, isLoading: isLoadingOpen } = useQuery({
    queryKey: ['open-orders-count'],
    queryFn: async () => {
      const { data } = await api.get('/orders/open');
      return data as { count: number };
    },
    enabled: showClose,
  });

  const { data: openOrdersList = [], isLoading: isLoadingList } = useQuery({
    queryKey: ['open-orders-list'],
    queryFn: async () => {
      const { data } = await api.get('/orders/open/list');
      return data as Array<{
        id: string; orderNumber: string; status: string;
        total: number; createdAt: string;
        cashier: { fullName: string };
        restaurantTable: { name: string } | null;
      }>;
    },
    enabled: showClose,
  });

  const createOp = useMutation({
    mutationFn: async (f: typeof opForm) => {
      try {
        return await api.post('/register-ops', { ...f, amount: Number(f.amount) });
      } catch {
        return { data: { id: 'local', ...f, amount: Number(f.amount), createdAt: new Date().toISOString(), user: { fullName: 'Кассир' } } };
      }
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['register-ops'] }); setShowOp(false); setOpForm({ type: 'CASH_IN', amount: '', reason: '' }); },
  });

  const dayPayments = dashboard?.dayPayments || [];
  const dayRevenue = Number(dashboard?.dayRevenue || 0);
  const dayOrderCount = dashboard?.dayOrders || 0;

  const cashPayments = dayPayments.find((p) => p.method === 'CASH');
  const cardPayments = dayPayments.filter((p) => p.method !== 'CASH');
  const totalCash = Number(cashPayments?._sum?.amount || 0);
  const totalCard = cardPayments.reduce((s, p) => s + Number(p._sum?.amount || 0), 0);

  const cashInTotal = registerOps.filter((o) => o.type === 'CASH_IN').reduce((s, o) => s + o.amount, 0);
  const cashOutTotal = registerOps.filter((o) => o.type === 'CASH_OUT').reduce((s, o) => s + o.amount, 0);

  const methodIcon = (m: string) => {
    switch (m) {
      case 'CASH': return <DollarSign style={{ width: 20, height: 20, color: '#22C55E' }} />;
      case 'CARD': return <CreditCard style={{ width: 20, height: 20, color: '#2563EB' }} />;
      case 'CLICK': return <Smartphone style={{ width: 20, height: 20, color: '#8B5CF6' }} />;
      case 'PAYME': return <Smartphone style={{ width: 20, height: 20, color: '#0891B2' }} />;
      default: return <DollarSign style={{ width: 20, height: 20 }} />;
    }
  };
  const methodLabel = (m: string) => ({ CASH: 'Наличные', CARD: 'Карта', CLICK: 'Click', PAYME: 'Payme' }[m] || m);

  const goToToday = () => setSelectedDate(new Date().toISOString().slice(0, 10));
  const goPrevDay = () => { const d = new Date(selectedDate); d.setDate(d.getDate() - 1); setSelectedDate(d.toISOString().slice(0, 10)); };
  const goNextDay = () => { const d = new Date(selectedDate); d.setDate(d.getDate() + 1); setSelectedDate(d.toISOString().slice(0, 10)); };

  const dateLabel = (() => {
    const today = new Date().toISOString().slice(0, 10);
    if (selectedDate === today) return 'Сегодня';
    const d = new Date(selectedDate);
    return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
  })();

  return (
    <div style={pageStyle}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>Отчёт по дням</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={goPrevDay} style={{ width: 36, height: 36, borderRadius: 10, border: '1px solid #E5E7EB', background: '#FFFFFF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>◀</button>
          <div style={{ position: 'relative' }}>
            <Calendar style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: '#6B7280', pointerEvents: 'none' }} />
            <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)}
              style={{ height: 36, padding: '0 12px 0 32px', borderRadius: 10, border: '1px solid #E5E7EB', fontSize: 13 }} />
          </div>
          <button onClick={goNextDay} style={{ width: 36, height: 36, borderRadius: 10, border: '1px solid #E5E7EB', background: '#FFFFFF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>▶</button>
          {selectedDate !== new Date().toISOString().slice(0, 10) && (
            <button onClick={goToToday} style={{ ...btnPrimary, background: '#22C55E', fontSize: 12 }}>Сегодня</button>
          )}
          <button onClick={() => setShowOp(true)} style={{ ...btnPrimary, background: '#F59E0B' }}>
            <Plus style={{ width: 16, height: 16 }} /> Операция
          </button>
          <button onClick={() => setShowClose(true)} style={{ ...btnPrimary, background: '#DC2626' }}>
            <Lock style={{ width: 16, height: 16 }} /> Закрыть кассу
          </button>
        </div>
      </div>

      <p style={{ fontSize: 14, color: '#6B7280', marginTop: -16 }}>{dateLabel}</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
        {[
          { label: 'Продажи за день', value: `${dayRevenue.toLocaleString('uz-UZ')} сўм`, bg: '#DCFCE7', icon: <TrendingUp style={{ width: 20, height: 20, color: '#22C55E' }} /> },
          { label: 'Заказов за день', value: `${dayOrderCount}`, bg: '#DBEAFE', icon: <ShoppingCart style={{ width: 20, height: 20, color: '#2563EB' }} /> },
          { label: 'Наличные', value: `${totalCash.toLocaleString('uz-UZ')} сўм`, bg: '#DCFCE7', icon: <DollarSign style={{ width: 20, height: 20, color: '#22C55E' }} /> },
          { label: 'Карта / Online', value: `${totalCard.toLocaleString('uz-UZ')} сўм`, bg: '#DBEAFE', icon: <CreditCard style={{ width: 20, height: 20, color: '#2563EB' }} /> },
          { label: 'Внесено в кассу', value: `+${cashInTotal.toLocaleString('uz-UZ')} сўм`, bg: '#F5F3FF', icon: <ArrowDownCircle style={{ width: 20, height: 20, color: '#8B5CF6' }} /> },
          { label: 'Вынуто из кассы', value: `-${cashOutTotal.toLocaleString('uz-UZ')} сўм`, bg: '#FEE2E2', icon: <ArrowUpCircle style={{ width: 20, height: 20, color: '#EF4444' }} /> },
        ].map((s) => (
          <div key={s.label} style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{s.icon}</div>
              <div>
                <p style={{ fontSize: 13, color: '#6B7280' }}>{s.label}</p>
                <p style={{ fontSize: 20, fontWeight: 700 }}>{s.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 16 }}>
        <div style={cardStyle}>
          <h2 style={{ fontWeight: 600, marginBottom: 16 }}>Оплата по методам</h2>
          {dayPayments.length === 0 ? (
            <p style={{ fontSize: 13, color: '#6B7280' }}>Нет оплат за выбранный день</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {dayPayments.map((pm) => (
                <div key={pm.method} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {methodIcon(pm.method)}
                    <span style={{ fontSize: 14, fontWeight: 500 }}>{methodLabel(pm.method)}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontWeight: 600 }}>{Number(pm._sum?.amount || 0).toLocaleString('uz-UZ')} сўм</p>
                    <p style={{ fontSize: 12, color: '#6B7280' }}>{pm._count} операций</p>
                  </div>
                </div>
              ))}
              <div style={{ paddingTop: 12, borderTop: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                <span>Итого</span>
                <span>{dayRevenue.toLocaleString('uz-UZ')} сўм</span>
              </div>
            </div>
          )}
        </div>

        <div style={cardStyle}>
          <h2 style={{ fontWeight: 600, marginBottom: 16 }}>Движение кассы</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
              <span style={{ color: '#6B7280' }}>Наличные за день</span>
              <span style={{ fontWeight: 500 }}>{totalCash.toLocaleString('uz-UZ')} сўм</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
              <span style={{ color: '#6B7280' }}>+ Внесено</span>
              <span style={{ fontWeight: 500, color: '#22C55E' }}>+{cashInTotal.toLocaleString('uz-UZ')} сўм</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
              <span style={{ color: '#6B7280' }}>- Вынуто</span>
              <span style={{ fontWeight: 500, color: '#EF4444' }}>-{cashOutTotal.toLocaleString('uz-UZ')} сўм</span>
            </div>
            <div style={{ paddingTop: 12, borderTop: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 18 }}>
              <span>Итого в кассе</span>
              <span style={{ color: '#2563EB' }}>{(totalCash + cashInTotal - cashOutTotal).toLocaleString('uz-UZ')} сўм</span>
            </div>
          </div>
        </div>
      </div>

      {registerOps.length > 0 && (
        <div style={cardStyle}>
          <h2 style={{ fontWeight: 600, marginBottom: 12 }}>Операции за день</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {registerOps.map((op) => (
              <div key={op.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #F3F4F6' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {op.type === 'CASH_IN' ? <ArrowDownCircle style={{ width: 16, height: 16, color: '#22C55E' }} /> : <ArrowUpCircle style={{ width: 16, height: 16, color: '#EF4444' }} />}
                  <div>
                    <span style={{ fontSize: 14, fontWeight: 500 }}>{op.reason || (op.type === 'CASH_IN' ? 'Внесение' : 'Выемка')}</span>
                    <span style={{ fontSize: 12, color: '#6B7280', marginLeft: 8 }}>{op.user.fullName}</span>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontWeight: 600, color: op.type === 'CASH_IN' ? '#22C55E' : '#EF4444' }}>
                    {op.type === 'CASH_IN' ? '+' : '-'}{op.amount.toLocaleString('uz-UZ')} сўм
                  </span>
                  <p style={{ fontSize: 12, color: '#6B7280' }}>{new Date(op.createdAt).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showOp && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)' }}>
          <div style={{ background: '#FFFFFF', borderRadius: 16, width: '100%', maxWidth: 400, margin: '0 16px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #E5E7EB' }}>
              <h2 style={{ fontSize: 16, fontWeight: 600 }}>Операция с кассой</h2>
              <button onClick={() => setShowOp(false)} style={{ padding: 4, background: 'none', border: 'none', cursor: 'pointer', borderRadius: 6 }}><X style={{ width: 20, height: 20 }} /></button>
            </div>
            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <button onClick={() => setOpForm({ ...opForm, type: 'CASH_IN' })} style={{
                  padding: 12, borderRadius: 10, border: `2px solid ${opForm.type === 'CASH_IN' ? '#22C55E' : '#E5E7EB'}`, background: opForm.type === 'CASH_IN' ? '#F0FDF4' : '#FFFFFF',
                  fontSize: 13, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  color: opForm.type === 'CASH_IN' ? '#16A34A' : '#6B7280',
                }}>
                  <ArrowDownCircle style={{ width: 16, height: 16 }} /> Внести
                </button>
                <button onClick={() => setOpForm({ ...opForm, type: 'CASH_OUT' })} style={{
                  padding: 12, borderRadius: 10, border: `2px solid ${opForm.type === 'CASH_OUT' ? '#EF4444' : '#E5E7EB'}`, background: opForm.type === 'CASH_OUT' ? '#FEF2F2' : '#FFFFFF',
                  fontSize: 13, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  color: opForm.type === 'CASH_OUT' ? '#DC2626' : '#6B7280',
                }}>
                  <ArrowUpCircle style={{ width: 16, height: 16 }} /> Вынять
                </button>
              </div>
              <div>
                <label style={labelStyle}>Сумма *</label>
                <input type="number" value={opForm.amount} onChange={(e) => setOpForm({ ...opForm, amount: e.target.value })} placeholder="0" style={{ ...inputStyle, height: 44, fontSize: 18, fontWeight: 600, textAlign: 'center' }} />
              </div>
              <div>
                <label style={labelStyle}>Причина</label>
                <input value={opForm.reason} onChange={(e) => setOpForm({ ...opForm, reason: e.target.value })} placeholder="Начало смены / инкассация / ..." style={inputStyle} />
              </div>
              <button onClick={() => createOp.mutate(opForm)} disabled={!opForm.amount || Number(opForm.amount) <= 0} style={{ ...btnPrimary, width: '100%', height: 44, justifyContent: 'center', opacity: !opForm.amount || Number(opForm.amount) <= 0 ? 0.5 : 1 }}>
                Выполнить
              </button>
            </div>
          </div>
        </div>
      )}

      {showClose && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)' }}>
          <div style={{ background: '#FFFFFF', borderRadius: 16, width: '100%', maxWidth: 500, margin: '0 16px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #E5E7EB' }}>
              <h2 style={{ fontSize: 16, fontWeight: 600 }}>Закрытие кассы</h2>
              <button onClick={() => setShowClose(false)} style={{ padding: 4, background: 'none', border: 'none', cursor: 'pointer', borderRadius: 6 }}><X style={{ width: 20, height: 20 }} /></button>
            </div>
            <div style={{ padding: 20 }}>
              {(isLoadingOpen || isLoadingList) ? (
                <div style={{ textAlign: 'center', padding: '32px 0' }}>
                  <div style={{ width: 32, height: 32, border: '3px solid #2563EB', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.6s linear infinite', margin: '0 auto 12px' }} />
                  <p style={{ color: '#6B7280', fontSize: 14 }}>Проверка...</p>
                </div>
              ) : (openOrdersData?.count ?? 0) > 0 ? (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: '#FEF3C7', borderRadius: 10, marginBottom: 16 }}>
                    <AlertTriangle style={{ width: 20, height: 20, color: '#D97706', flexShrink: 0 }} />
                    <div>
                      <p style={{ fontWeight: 600, color: '#92400E' }}>Невозможно закрыть кассу</p>
                      <p style={{ fontSize: 13, color: '#A16207' }}>Есть {openOrdersData?.count ?? 0} незакрытых чеков.</p>
                    </div>
                  </div>
                  <div style={{ maxHeight: 240, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {openOrdersList.map((o) => (
                      <div key={o.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#F9FAFB', borderRadius: 10, border: '1px solid #E5E7EB' }}>
                        <div>
                          <p style={{ fontWeight: 500, fontSize: 14 }}>{o.orderNumber}</p>
                          <p style={{ fontSize: 12, color: '#6B7280' }}>{o.restaurantTable?.name || 'Без стола'} · {o.cashier.fullName}</p>
                        </div>
                        <p style={{ fontWeight: 600 }}>{Number(o.total).toLocaleString('uz-UZ')} сўм</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center' }}>
                  <Lock style={{ width: 28, height: 28, color: '#22C55E', marginBottom: 8 }} />
                  <p style={{ fontWeight: 600, marginBottom: 16 }}>Все чеки закрыты. Можно закрыть кассу.</p>
                  <button style={{ ...btnPrimary, width: '100%', height: 44, justifyContent: 'center', background: '#DC2626' }}>
                    <Lock style={{ width: 16, height: 16 }} /> Подтвердить закрытие
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
