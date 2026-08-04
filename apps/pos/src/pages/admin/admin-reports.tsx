import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { BarChart3, DollarSign, TrendingUp, ShoppingCart, Package, Calendar } from 'lucide-react';

interface DailyReport {
  totalOrders: number;
  totalSales: number;
  totalDiscount: number;
  totalTax: number;
  totalItems: number;
  avgCheck: number;
  paymentBreakdown: { method: string; label: string; amount: number; percentage: number }[];
}

interface ProfitReport {
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  profitMargin: number;
  totalOrders: number;
  totalItems: number;
  topProducts: { name: string; quantity: number; revenue: number; cost: number; profit: number }[];
}

export function AdminReports() {
  const [tab, setTab] = useState<'daily' | 'profit'>('daily');
  const [dateFrom, setDateFrom] = useState(new Date().toISOString().split('T')[0]);
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);

  const { data: dailyData, isLoading: loadingDaily } = useQuery({
    queryKey: ['admin-reports-daily', dateFrom, dateTo],
    queryFn: async () => {
      const { data } = await api.get('/admin/reports/daily', { params: { from: dateFrom, to: dateTo } });
      return data as DailyReport;
    },
    enabled: tab === 'daily',
  });

  const { data: profitData, isLoading: loadingProfit } = useQuery({
    queryKey: ['admin-reports-profit', dateFrom, dateTo],
    queryFn: async () => {
      const { data } = await api.get('/admin/reports/profit', { params: { from: dateFrom, to: dateTo } });
      return data as ProfitReport;
    },
    enabled: tab === 'profit',
  });

  const isLoading = tab === 'daily' ? loadingDaily : loadingProfit;

  const fmt = (n: number) => n.toLocaleString('uz-UZ');

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>Отчёты</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Calendar style={{ width: 16, height: 16, color: '#6B7280' }} />
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} style={{ height: 36, padding: '0 10px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 13, outline: 'none' }} />
          <span style={{ color: '#9CA3AF' }}>—</span>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} style={{ height: 36, padding: '0 10px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 13, outline: 'none' }} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={() => setTab('daily')} style={{ padding: '8px 16px', borderRadius: 8, border: tab === 'daily' ? '2px solid #2563EB' : '1px solid #E5E7EB', background: tab === 'daily' ? '#EFF6FF' : '#FFFFFF', color: tab === 'daily' ? '#2563EB' : '#374151', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
          <BarChart3 style={{ width: 14, height: 14, display: 'inline', marginRight: 6 }} />Продажи
        </button>
        <button onClick={() => setTab('profit')} style={{ padding: '8px 16px', borderRadius: 8, border: tab === 'profit' ? '2px solid #16A34A' : '1px solid #E5E7EB', background: tab === 'profit' ? '#F0FDF4' : '#FFFFFF', color: tab === 'profit' ? '#16A34A' : '#374151', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
          <TrendingUp style={{ width: 14, height: 14, display: 'inline', marginRight: 6 }} />Прибыль
        </button>
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: 48, color: '#6B7280' }}>Загрузка...</div>
      ) : tab === 'daily' && dailyData ? (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
            {[
              { label: 'Заказов', value: dailyData.totalOrders, icon: ShoppingCart, bg: '#EFF6FF', color: '#2563EB' },
              { label: 'Продажи', value: `${fmt(dailyData.totalSales)} сўм`, icon: DollarSign, bg: '#F0FDF4', color: '#22C55E' },
              { label: 'Средний чек', value: `${fmt(dailyData.avgCheck)} сўм`, icon: TrendingUp, bg: '#FFF7ED', color: '#F97316' },
              { label: 'Позиций', value: dailyData.totalItems, icon: Package, bg: '#F5F3FF', color: '#8B5CF6' },
            ].map((s) => (
              <div key={s.label} style={{ background: '#FFFFFF', borderRadius: 16, border: '1px solid #E5E7EB', padding: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <s.icon style={{ width: 20, height: 20, color: s.color }} />
                  </div>
                  <div>
                    <p style={{ fontSize: 13, color: '#6B7280' }}>{s.label}</p>
                    <p style={{ fontSize: 18, fontWeight: 700 }}>{s.value}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {dailyData.paymentBreakdown.length > 0 && (
            <div style={{ background: '#FFFFFF', borderRadius: 16, border: '1px solid #E5E7EB', padding: 20 }}>
              <h2 style={{ fontWeight: 600, marginBottom: 12 }}>Оплата по методам</h2>
              {dailyData.paymentBreakdown.map((p) => (
                <div key={p.method} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: '1px solid #F3F4F6' }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 500, fontSize: 14 }}>{p.label}</p>
                    <div style={{ height: 6, borderRadius: 3, background: '#F3F4F6', marginTop: 4 }}>
                      <div style={{ height: '100%', borderRadius: 3, background: '#2563EB', width: `${p.percentage}%` }} />
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontWeight: 600 }}>{fmt(p.amount)} сўм</p>
                    <p style={{ fontSize: 12, color: '#9CA3AF' }}>{p.percentage}%</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {dailyData.totalDiscount > 0 && (
            <div style={{ background: '#FFFBEB', borderRadius: 12, border: '1px solid #FDE68A', padding: 16, fontSize: 14, color: '#92400E' }}>
              Скидки: {fmt(dailyData.totalDiscount)} сўм · Налог: {fmt(dailyData.totalTax)} сўм
            </div>
          )}
        </>
      ) : tab === 'profit' && profitData ? (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
            {[
              { label: 'Выручка', value: `${fmt(profitData.totalRevenue)} сўм`, bg: '#F0FDF4', color: '#22C55E' },
              { label: 'Себестоимость', value: `${fmt(profitData.totalCost)} сўм`, bg: '#FEF2F2', color: '#DC2626' },
              { label: 'Прибыль', value: `${fmt(profitData.totalProfit)} сўм`, bg: '#EFF6FF', color: '#2563EB' },
              { label: 'Маржа', value: `${profitData.profitMargin}%`, bg: '#F5F3FF', color: '#8B5CF6' },
            ].map((s, i) => (
              <div key={i} style={{ background: '#FFFFFF', borderRadius: 16, border: '1px solid #E5E7EB', padding: 20 }}>
                <p style={{ fontSize: 13, color: '#6B7280' }}>{s.label}</p>
                <p style={{ fontSize: 20, fontWeight: 700, color: s.color, marginTop: 4 }}>{s.value}</p>
              </div>
            ))}
          </div>

          {profitData.topProducts.length > 0 && (
            <div style={{ background: '#FFFFFF', borderRadius: 16, border: '1px solid #E5E7EB', padding: 20 }}>
              <h2 style={{ fontWeight: 600, marginBottom: 12 }}>Топ товары по прибыли</h2>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 13, color: '#6B7280', borderBottom: '1px solid #E5E7EB' }}>Товар</th>
                    <th style={{ padding: '8px 12px', textAlign: 'right', fontSize: 13, color: '#6B7280', borderBottom: '1px solid #E5E7EB' }}>Кол-во</th>
                    <th style={{ padding: '8px 12px', textAlign: 'right', fontSize: 13, color: '#6B7280', borderBottom: '1px solid #E5E7EB' }}>Выручка</th>
                    <th style={{ padding: '8px 12px', textAlign: 'right', fontSize: 13, color: '#6B7280', borderBottom: '1px solid #E5E7EB' }}>Себест.</th>
                    <th style={{ padding: '8px 12px', textAlign: 'right', fontSize: 13, color: '#6B7280', borderBottom: '1px solid #E5E7EB' }}>Прибыль</th>
                  </tr>
                </thead>
                <tbody>
                  {profitData.topProducts.map((p, i) => (
                    <tr key={i}>
                      <td style={{ padding: '8px 12px', fontSize: 14, borderBottom: '1px solid #F3F4F6' }}>{p.name}</td>
                      <td style={{ padding: '8px 12px', textAlign: 'right', fontSize: 14, borderBottom: '1px solid #F3F4F6' }}>{p.quantity} шт</td>
                      <td style={{ padding: '8px 12px', textAlign: 'right', fontSize: 14, borderBottom: '1px solid #F3F4F6' }}>{fmt(p.revenue)} сўм</td>
                      <td style={{ padding: '8px 12px', textAlign: 'right', fontSize: 14, color: '#DC2626', borderBottom: '1px solid #F3F4F6' }}>{fmt(p.cost)} сўм</td>
                      <td style={{ padding: '8px 12px', textAlign: 'right', fontSize: 14, fontWeight: 600, color: p.profit >= 0 ? '#16A34A' : '#DC2626', borderBottom: '1px solid #F3F4F6' }}>{fmt(p.profit)} сўм</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
