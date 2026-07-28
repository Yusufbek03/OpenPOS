import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function CategoriesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: async () => {
      const { data } = await api.get('/categories', { params: { limit: 100 } });
      return data.categories;
    },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[var(--color-text)]">Категории</h1>
      <div className="bg-[var(--color-surface)] rounded-[var(--radius-md)] border border-[var(--color-border)] overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-[var(--color-border)]">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-[var(--color-muted)]">Название</th>
              <th className="text-left px-4 py-3 font-medium text-[var(--color-muted)]">Товаров</th>
              <th className="text-left px-4 py-3 font-medium text-[var(--color-muted)]">Статус</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={3} className="text-center py-8 text-[var(--color-muted)]">Загрузка...</td></tr>
            ) : (
              data?.map((c: { id: string; nameRu: string; _count: { products: number }; isActive: boolean }) => (
                <tr key={c.id} className="border-b border-[var(--color-border)] hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{c.nameRu}</td>
                  <td className="px-4 py-3 text-[var(--color-muted)]">{c._count?.products ?? 0}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${c.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {c.isActive ? 'Активна' : 'Неактивна'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
