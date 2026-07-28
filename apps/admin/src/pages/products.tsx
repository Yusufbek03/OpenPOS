import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';

export function ProductsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', nameRu: '', nameEn: '', nameUz: '', sku: '', barcode: '', price: '0', cost: '0', taxRate: '0', categoryId: '', imageUrl: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['admin-products', page, search],
    queryFn: async () => {
      const { data } = await api.get('/products', { params: { page, limit: 20, search: search || undefined } });
      return data;
    },
  });

  const { data: categories } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: async () => {
      const { data } = await api.get('/categories', { params: { limit: 100 } });
      return data.categories;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { await api.delete(`/products/${id}`); },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-products'] }),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editId) {
      await api.patch(`/products/${editId}`, form);
    } else {
      await api.post('/products', form);
    }
    setShowForm(false);
    setEditId(null);
    setForm({ name: '', nameRu: '', nameEn: '', nameUz: '', sku: '', barcode: '', price: '0', cost: '0', taxRate: '0', categoryId: '', imageUrl: '' });
    queryClient.invalidateQueries({ queryKey: ['admin-products'] });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[var(--color-text)]">Товары</h1>
        <button onClick={() => { setShowForm(true); setEditId(null); }} className="flex items-center gap-2 h-10 px-4 rounded-[var(--radius-md)] bg-[var(--color-primary)] text-white text-sm font-medium hover:bg-[var(--color-primary-hover)]">
          <Plus className="w-4 h-4" /> Добавить
        </button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-muted)]" />
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Поиск товаров..."
          className="w-full h-10 pl-9 pr-4 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
        />
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-[var(--color-surface)] rounded-[var(--radius-md)] border border-[var(--color-border)] p-5 space-y-4">
          <h2 className="font-semibold">{editId ? 'Редактировать товар' : 'Новый товар'}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <input placeholder="Название" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="h-9 px-3 rounded border border-[var(--color-border)] text-sm" required />
            <input placeholder="Название (RU)" value={form.nameRu} onChange={(e) => setForm({ ...form, nameRu: e.target.value })} className="h-9 px-3 rounded border border-[var(--color-border)] text-sm" required />
            <input placeholder="SKU" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} className="h-9 px-3 rounded border border-[var(--color-border)] text-sm" required />
            <input placeholder="Штрих-код" value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} className="h-9 px-3 rounded border border-[var(--color-border)] text-sm" />
            <input placeholder="Цена" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="h-9 px-3 rounded border border-[var(--color-border)] text-sm" required />
            <input placeholder="Себестоимость" type="number" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} className="h-9 px-3 rounded border border-[var(--color-border)] text-sm" />
            <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} className="h-9 px-3 rounded border border-[var(--color-border)] text-sm">
              <option value="">Категория</option>
              {categories?.map((c: { id: string; nameRu: string }) => <option key={c.id} value={c.id}>{c.nameRu}</option>)}
            </select>
            <input placeholder="Изображение URL" value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} className="h-9 px-3 rounded border border-[var(--color-border)] text-sm" />
          </div>
          <div className="flex gap-2">
            <button type="submit" className="h-9 px-4 rounded bg-[var(--color-primary)] text-white text-sm font-medium hover:bg-[var(--color-primary-hover)]">
              {editId ? 'Сохранить' : 'Создать'}
            </button>
            <button type="button" onClick={() => { setShowForm(false); setEditId(null); }} className="h-9 px-4 rounded border border-[var(--color-border)] text-sm hover:bg-gray-50">Отмена</button>
          </div>
        </form>
      )}

      <div className="bg-[var(--color-surface)] rounded-[var(--radius-md)] border border-[var(--color-border)] overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-[var(--color-border)]">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-[var(--color-muted)]">Название</th>
              <th className="text-left px-4 py-3 font-medium text-[var(--color-muted)]">SKU</th>
              <th className="text-left px-4 py-3 font-medium text-[var(--color-muted)]">Цена</th>
              <th className="text-left px-4 py-3 font-medium text-[var(--color-muted)]">Статус</th>
              <th className="text-right px-4 py-3 font-medium text-[var(--color-muted)]">Действия</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={5} className="text-center py-8 text-[var(--color-muted)]">Загрузка...</td></tr>
            ) : data?.products?.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-8 text-[var(--color-muted)]">Нет товаров</td></tr>
            ) : (
              data?.products?.map((p: { id: string; nameRu: string; sku: string; price: string; isActive: boolean }) => (
                <tr key={p.id} className="border-b border-[var(--color-border)] hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{p.nameRu}</td>
                  <td className="px-4 py-3 text-[var(--color-muted)]">{p.sku}</td>
                  <td className="px-4 py-3">{Number(p.price).toLocaleString('ru-RU')} ₽</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${p.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {p.isActive ? 'Активен' : 'Неактивен'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => { setForm({ name: p.nameRu, nameRu: p.nameRu, nameEn: '', nameUz: '', sku: p.sku, barcode: '', price: p.price, cost: '0', taxRate: '0', categoryId: '', imageUrl: '' }); setEditId(p.id); setShowForm(true); }} className="p-1.5 rounded hover:bg-gray-100 text-[var(--color-muted)]"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => deleteMutation.mutate(p.id)} className="p-1.5 rounded hover:bg-red-100 text-[var(--color-danger)]"><Trash2 className="w-4 h-4" /></button>
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
