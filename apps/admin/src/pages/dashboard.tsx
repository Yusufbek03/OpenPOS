import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ShoppingCart, DollarSign, Package, Users } from 'lucide-react';

export function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const { data } = await api.get('/reports/dashboard');
      return data;
    },
  });

  const stats = [
    { label: 'Заказов сегодня', value: data?.todayOrders ?? 0, icon: ShoppingCart, color: 'bg-blue-100 text-blue-700' },
    { label: 'Выручка сегодня', value: `${Number(data?.todayRevenue ?? 0).toLocaleString('ru-RU')} ₽`, icon: DollarSign, color: 'bg-green-100 text-green-700' },
    { label: 'Всего заказов', value: data?.totalOrders ?? 0, icon: Package, color: 'bg-purple-100 text-purple-700' },
    { label: 'Общая выручка', value: `${Number(data?.totalRevenue ?? 0).toLocaleString('ru-RU')} ₽`, icon: Users, color: 'bg-orange-100 text-orange-700' },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-3 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[var(--color-text)]">Дашборд</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-[var(--color-surface)] rounded-[var(--radius-md)] border border-[var(--color-border)] p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--color-muted)]">{stat.label}</p>
                <p className="text-2xl font-bold text-[var(--color-text)] mt-1">{stat.value}</p>
              </div>
              <div className={`w-12 h-12 rounded-[var(--radius-md)] flex items-center justify-center ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[var(--color-surface)] rounded-[var(--radius-md)] border border-[var(--color-border)] p-5">
          <h2 className="font-semibold text-[var(--color-text)] mb-4">Активные заказы</h2>
          {data?.activeOrders?.length === 0 ? (
            <p className="text-sm text-[var(--color-muted)]">Нет активных заказов</p>
          ) : (
            <div className="space-y-2">
              {data?.activeOrders?.slice(0, 5).map((order: { id: string; orderNumber: string; status: string }) => (
                <div key={order.id} className="flex items-center justify-between p-2 rounded-[var(--radius-sm)] bg-gray-50">
                  <span className="text-sm font-medium">{order.orderNumber}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">{order.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-[var(--color-surface)] rounded-[var(--radius-md)] border border-[var(--color-border)] p-5">
          <h2 className="font-semibold text-[var(--color-text)] mb-4">Топ товаров</h2>
          {data?.topProducts?.length === 0 ? (
            <p className="text-sm text-[var(--color-muted)]">Нет данных</p>
          ) : (
            <div className="space-y-2">
              {data?.topProducts?.slice(0, 5).map((item: { productId: string; _sum: { total: string | number }; _count: number }, index: number) => (
                <div key={item.productId} className="flex items-center gap-3 p-2 rounded-[var(--radius-sm)] bg-gray-50">
                  <span className="text-sm font-bold text-[var(--color-muted)] w-5">{index + 1}</span>
                  <span className="text-sm flex-1">{item.productId}</span>
                  <span className="text-sm font-medium">{Number(item._sum.total).toLocaleString('ru-RU')} ₽</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
