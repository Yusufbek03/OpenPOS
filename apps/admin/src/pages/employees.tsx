import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function EmployeesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data } = await api.get('/users', { params: { limit: 50 } });
      return data;
    },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[var(--color-text)]">Сотрудники</h1>
      <div className="bg-[var(--color-surface)] rounded-[var(--radius-md)] border border-[var(--color-border)] overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-[var(--color-border)]">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-[var(--color-muted)]">Имя</th>
              <th className="text-left px-4 py-3 font-medium text-[var(--color-muted)]">Логин</th>
              <th className="text-left px-4 py-3 font-medium text-[var(--color-muted)]">Роль</th>
              <th className="text-left px-4 py-3 font-medium text-[var(--color-muted)]">Статус</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={4} className="text-center py-8 text-[var(--color-muted)]">Загрузка...</td></tr>
            ) : (
              data?.users?.map((u: { id: string; fullName: string; username: string; role: { name: string }; isActive: boolean }) => (
                <tr key={u.id} className="border-b border-[var(--color-border)] hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{u.fullName}</td>
                  <td className="px-4 py-3 text-[var(--color-muted)]">{u.username}</td>
                  <td className="px-4 py-3">{u.role?.name}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${u.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {u.isActive ? 'Активен' : 'Неактивен'}
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
