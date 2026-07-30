import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ShoppingCart, DollarSign, Package, TrendingUp, Download, FileSpreadsheet } from 'lucide-react';

interface DashboardData {
  totalOrders: number;
  todayOrders: number;
  totalRevenue: string | number;
  todayRevenue: string | number;
  topProducts: { _sum: { quantity: string | number; total: string | number }; _count: number; productId: string }[];
  lowStock: { productId: string; quantity: string | number; product: { name: string } }[];
  activeOrders: { id: string; orderNumber: string; status: string; createdAt: string }[];
}

export function AdminDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: async () => {
      const { data } = await api.get<DashboardData>('/admin/reports/dashboard');
      return data;
    },
  });

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 256 }}>
        <div style={{ width: 32, height: 32, border: '3px solid #2563EB', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
      </div>
    );
  }

  const stats = [
    { label: 'Заказов сегодня', value: data?.todayOrders ?? 0, icon: ShoppingCart, bg: '#EFF6FF', color: '#2563EB' },
    { label: 'Выручка сегодня', value: `${Number(data?.todayRevenue ?? 0).toLocaleString('uz-UZ')} сўм`, icon: DollarSign, bg: '#F0FDF4', color: '#22C55E' },
    { label: 'Всего заказов', value: data?.totalOrders ?? 0, icon: Package, bg: '#F5F3FF', color: '#8B5CF6' },
    { label: 'Общая выручка', value: `${Number(data?.totalRevenue ?? 0).toLocaleString('uz-UZ')} сўм`, icon: TrendingUp, bg: '#FFF7ED', color: '#F97316' },
  ];

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>Дашборд</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <a href={`${api.defaults.baseURL}/export/sales/csv`} target="_blank" rel="noopener"
            style={{ height: 36, padding: '0 14px', borderRadius: 10, border: '1px solid #E5E7EB', background: '#FFFFFF', color: '#374151', fontSize: 13, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}>
            <Download style={{ width: 14, height: 14 }} /> Продажи CSV
          </a>
          <a href={`${api.defaults.baseURL}/export/sales/excel`} target="_blank" rel="noopener"
            style={{ height: 36, padding: '0 14px', borderRadius: 10, border: '1px solid #E5E7EB', background: '#FFFFFF', color: '#374151', fontSize: 13, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}>
            <FileSpreadsheet style={{ width: 14, height: 14 }} /> Продажи Excel
          </a>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
        {stats.map((s) => (
          <div key={s.label} style={{ background: '#FFFFFF', borderRadius: 16, border: '1px solid #E5E7EB', padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <s.icon style={{ width: 20, height: 20, color: s.color }} />
              </div>
              <div>
                <p style={{ fontSize: 13, color: '#6B7280' }}>{s.label}</p>
                <p style={{ fontSize: 20, fontWeight: 700 }}>{s.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {data?.activeOrders && data.activeOrders.length > 0 && (
        <div style={{ background: '#FFFFFF', borderRadius: 16, border: '1px solid #E5E7EB', padding: 20 }}>
          <h2 style={{ fontWeight: 600, marginBottom: 12 }}>Активные заказы</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {data.activeOrders.map((order) => (
              <div key={order.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #F3F4F6' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontWeight: 500 }}>{order.orderNumber}</span>
                  <span style={{ fontSize: 13, color: '#6B7280' }}>{new Date(order.createdAt).toLocaleTimeString('uz-UZ')}</span>
                </div>
                <span style={{
                  fontSize: 12,
                  padding: '4px 10px',
                  borderRadius: 20,
                  fontWeight: 500,
                  background: order.status === 'SENT_TO_KITCHEN' ? '#FEF9C3' : order.status === 'COMPLETED' ? '#DCFCE7' : '#F3F4F6',
                  color: order.status === 'SENT_TO_KITCHEN' ? '#A16207' : order.status === 'COMPLETED' ? '#16A34A' : '#374151',
                }}>
                  {order.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {data?.topProducts && data.topProducts.length > 0 && (
        <div style={{ background: '#FFFFFF', borderRadius: 16, border: '1px solid #E5E7EB', padding: 20 }}>
          <h2 style={{ fontWeight: 600, marginBottom: 12 }}>Топ товары</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {data.topProducts.map((tp, i) => (
              <div key={tp.productId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #F3F4F6' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#9CA3AF', width: 24 }}>{i + 1}</span>
                  <span style={{ fontSize: 14 }}>{tp.productId.slice(0, 8)}...</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 14 }}>
                  <span style={{ fontWeight: 500 }}>{Number(tp._sum.quantity)} шт</span>
                  <span style={{ color: '#6B7280' }}>{Number(tp._sum.total).toLocaleString('uz-UZ')} сўм</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
