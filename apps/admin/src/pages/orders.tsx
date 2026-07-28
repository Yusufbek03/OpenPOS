import { useState } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  PENDING: 'bg-yellow-100 text-yellow-700',
  SENT_TO_KITCHEN: 'bg-blue-100 text-blue-700',
  PREPARING: 'bg-orange-100 text-orange-700',
  READY: 'bg-green-100 text-green-700',
  COMPLETED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

export function OrdersPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-orders', page, status],
    queryFn: async () => {
      const { data } = await api.get('/orders', { params: { page, limit: 20, status: status || undefined } });
      return data;
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async (id: string) => { await api.delete(`/orders/${id}`); },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-orders'] }),
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[var(--color-text)]">Заказы</h1>

      <div className="flex gap-2">
        {['', 'DRAFT', 'SENT_TO_KITCHEN', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED'].map((s) => (
          <button
            key={s}
            onClick={() => { setStatus(s); setPage(1); }}
            className={`h-8 px-3 rounded-full text-xs font-medium transition-colors ${status === s ? 'bg-[var(--color-primary)] text-white' : 'bg-[var(--color-surface)] text-[var(--color-muted)] border border-[var(--color-border)] hover:bg-gray-50'}`}
          >
            {s || 'Все'}
          </button>
        ))}
      </div>

      <div className="bg-[var(--color-surface)] rounded-[var(--radius-md)] border border-[var(--color-border)] overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-[var(--color-border)]">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-[var(--color-muted)]">Номер</th>
              <th className="text-left px-4 py-3 font-medium text-[var(--color-muted)]">Статус</th>
              <th className="text-left px-4 py-3 font-medium text-[var(--color-muted)]">Сумма</th>
              <th className="text-left px-4 py-3 font-medium text-[var(--color-muted)]">Дата</th>
              <th className="text-right px-4 py-3 font-medium text-[var(--color-muted)]">Действия</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={5} className="text-center py-8 text-[var(--color-muted)]">Загрузка...</td></tr>
            ) : data?.orders?.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-8 text-[var(--color-muted)]">Нет заказов</td></tr>
            ) : (
              data?.orders?.map((o: { id: string; orderNumber: string; status: string; total: string; createdAt: string }) => (
                <tr key={o.id} className="border-b border-[var(--color-border)] hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{o.orderNumber}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[o.status] ?? 'bg-gray-100'}`}>{o.status}</span>
                  </td>
                  <td className="px-4 py-3">{Number(o.total).toLocaleString('ru-RU')} ₽</td>
                  <td className="px-4 py-3 text-[var(--color-muted)]">{new Date(o.createdAt).toLocaleDateString('ru-RU')}</td>
                  <td className="px-4 py-3 text-right">
                    {o.status !== 'CANCELLED' && o.status !== 'COMPLETED' && (
                      <button onClick={() => cancelMutation.mutate(o.id)} className="text-xs text-[var(--color-danger)] hover:underline">Отменить</button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {data?.meta && (
        <div className="flex justify-center gap-2">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="h-8 px-3 rounded border border-[var(--color-border)] text-sm disabled:opacity-50">Назад</button>
          <span className="h-8 px-3 text-sm text-[var(--color-muted)]">Стр. {data.meta.page} из {data.meta.pages}</span>
          <button disabled={page >= data.meta.pages} onClick={() => setPage(page + 1)} className="h-8 px-3 rounded border border-[var(--color-border)] text-sm disabled:opacity-50">Далее</button>
        </div>
      )}
    </div>
  );
}
