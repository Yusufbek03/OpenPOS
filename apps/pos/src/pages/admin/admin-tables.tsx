import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Plus, Pencil, Trash2, X, Hash, Armchair, Loader2 } from 'lucide-react';

interface RestaurantTable {
  id: string; name: string; number: number; seats: number; zone: string | null; status: string;
  isActive: boolean; waiter: { id: string; fullName: string } | null;
  orders: { id: string; orderNumber: string; total: string | number }[];
}

const TABLE_STATUS_COLORS: Record<string, { bg: string; fg: string; label: string }> = {
  FREE: { bg: '#DCFCE7', fg: '#16A34A', label: 'Свободен' },
  OCCUPIED: { bg: '#FEE2E2', fg: '#DC2626', label: 'Занят' },
  RESERVED: { bg: '#DBEAFE', fg: '#2563EB', label: 'Забронирован' },
  CLEANING: { bg: '#FEF9C3', fg: '#A16207', label: 'Уборка' },
};

const cardStyle: React.CSSProperties = { background: '#FFFFFF', borderRadius: 16, border: '1px solid #E5E7EB', overflow: 'hidden' };
const inputStyle: React.CSSProperties = { width: '100%', height: 40, padding: '0 12px', borderRadius: 10, border: '1px solid #E5E7EB', fontSize: 14, boxSizing: 'border-box', outline: 'none' };
const btnBase: React.CSSProperties = { height: 40, padding: '0 16px', borderRadius: 10, border: 'none', fontSize: 14, fontWeight: 500, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 };

export function AdminTables() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<RestaurantTable | null>(null);
  const [form, setForm] = useState({ name: '', number: 1, seats: 4, zone: '', isActive: true });
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [zoneFilter, setZoneFilter] = useState('ALL');

  const { data: tables = [], isLoading } = useQuery({
    queryKey: ['admin-tables'],
    queryFn: async () => { const { data } = await api.get('/admin/tables'); return data as RestaurantTable[]; },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload: Record<string, unknown> = { ...form, zone: form.zone || undefined };
      if (editing) return api.patch(`/admin/tables/${editing.id}`, payload);
      return api.post('/admin/tables', payload);
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-tables'] }); setShowForm(false); setEditing(null); setForm({ name: '', number: 1, seats: 4, zone: '', isActive: true }); },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/admin/tables/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-tables'] }),
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status, waiterId }: { id: string; status: string; waiterId?: string | null }) =>
      api.patch(`/admin/tables/${id}/status`, { status, waiterId: waiterId === undefined ? undefined : waiterId }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-tables'] }),
  });

  const zones = ['ALL', ...Array.from(new Set(tables.map((t) => t.zone).filter(Boolean)))];
  const statuses = ['ALL', 'FREE', 'OCCUPIED', 'RESERVED', 'CLEANING'];
  const filtered = tables.filter((t) => statusFilter === 'ALL' || t.status === statusFilter).filter((t) => zoneFilter === 'ALL' || t.zone === zoneFilter);

  const openEdit = (t: RestaurantTable) => { setEditing(t); setForm({ name: t.name, number: t.number, seats: t.seats, zone: t.zone || '', isActive: t.isActive }); setShowForm(true); };
  const openCreate = () => { setEditing(null); const maxNum = tables.reduce((m, t) => Math.max(m, t.number), 0); setForm({ name: `Стол ${maxNum + 1}`, number: maxNum + 1, seats: 4, zone: '', isActive: true }); setShowForm(true); };

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>Столы</h1>
        <button onClick={openCreate} style={{ ...btnBase, background: '#2563EB', color: '#FFFFFF' }}><Plus style={{ width: 16, height: 16 }} /> Добавить стол</button>
      </div>

      {showForm && (
        <div style={{ ...cardStyle, padding: 20, display: 'flex', flexDirection: 'column', gap: 14, background: '#F9FAFB', border: '2px solid #2563EB' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontSize: 15, fontWeight: 600 }}>{editing ? 'Редактировать стол' : 'Новый стол'}</h3>
            <button onClick={() => { setShowForm(false); setEditing(null); }} style={{ padding: 4, background: 'none', border: 'none', cursor: 'pointer' }}><X style={{ width: 18, height: 18 }} /></button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#6B7280', marginBottom: 4 }}>Название</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#6B7280', marginBottom: 4 }}>Номер</label>
              <input type="number" value={form.number} onChange={(e) => setForm({ ...form, number: Number(e.target.value) })} style={inputStyle} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#6B7280', marginBottom: 4 }}>Мест</label>
              <input type="number" value={form.seats} onChange={(e) => setForm({ ...form, seats: Number(e.target.value) })} style={inputStyle} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#6B7280', marginBottom: 4 }}>Зона</label>
              <input value={form.zone} onChange={(e) => setForm({ ...form, zone: e.target.value })} style={inputStyle} placeholder="Зал / Терраса" />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
              <button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}
                style={{ ...btnBase, background: '#22C55E', color: '#FFFFFF', opacity: saveMutation.isPending ? 0.6 : 1, flex: 1 }}>
                {saveMutation.isPending ? <Loader2 style={{ width: 16, height: 16, animation: 'spin 0.6s linear infinite' }} /> : 'Сохранить'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 4, background: '#F3F4F6', borderRadius: 10, padding: 4 }}>
          {statuses.map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)} style={{ padding: '6px 12px', borderRadius: 8, fontSize: 13, fontWeight: 500, border: 'none', cursor: 'pointer', background: statusFilter === s ? '#FFFFFF' : 'transparent', color: statusFilter === s ? '#111827' : '#6B7280', boxShadow: statusFilter === s ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>
              {s === 'ALL' ? 'Все' : TABLE_STATUS_COLORS[s]?.label || s}
            </button>
          ))}
        </div>
        {zones.length > 1 && (
          <div style={{ display: 'flex', gap: 4, background: '#F3F4F6', borderRadius: 10, padding: 4 }}>
            {zones.map((z) => (
              <button key={z} onClick={() => setZoneFilter(z || 'ALL')} style={{ padding: '6px 12px', borderRadius: 8, fontSize: 13, fontWeight: 500, border: 'none', cursor: 'pointer', background: zoneFilter === (z || 'ALL') ? '#FFFFFF' : 'transparent', color: zoneFilter === (z || 'ALL') ? '#111827' : '#6B7280', boxShadow: zoneFilter === (z || 'ALL') ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>
                {z === 'ALL' ? 'Все зоны' : z}
              </button>
            ))}
          </div>
        )}
      </div>

      {isLoading ? (
        <div style={{ padding: 32, textAlign: 'center', color: '#6B7280' }}>Загрузка...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
          {filtered.map((t) => {
            const st = TABLE_STATUS_COLORS[t.status] ?? TABLE_STATUS_COLORS.FREE;
            return (
              <div key={t.id} style={{ ...cardStyle, padding: 16, display: 'flex', flexDirection: 'column', gap: 10, opacity: t.isActive ? 1 : 0.5 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: st?.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Hash style={{ width: 18, height: 18, color: st?.fg }} />
                    </div>
                    <div>
                      <p style={{ fontSize: 15, fontWeight: 600 }}>#{t.number}</p>
                      <p style={{ fontSize: 11, color: '#9CA3AF' }}>{t.name}</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 2 }}>
                    <button onClick={() => openEdit(t)} style={{ padding: 4, background: 'none', border: 'none', cursor: 'pointer', borderRadius: 6, color: '#6B7280' }}><Pencil style={{ width: 14, height: 14 }} /></button>
                    <button onClick={() => { if (confirm('Удалить стол?')) deleteMutation.mutate(t.id); }} style={{ padding: 4, background: 'none', border: 'none', cursor: 'pointer', borderRadius: 6, color: '#EF4444' }}><Trash2 style={{ width: 14, height: 14 }} /></button>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#6B7280' }}>
                  <Armchair style={{ width: 14, height: 14 }} /> {t.seats} мест
                  {t.zone && <span style={{ marginLeft: 4, padding: '2px 8px', borderRadius: 12, background: '#F3F4F6', fontSize: 11 }}>{t.zone}</span>}
                </div>

                <span style={{ fontSize: 12, padding: '4px 10px', borderRadius: 20, fontWeight: 500, background: st?.bg, color: st?.fg, alignSelf: 'flex-start' }}>{st?.label}</span>

                {t.waiter && <p style={{ fontSize: 12, color: '#6B7280' }}>Официант: <strong>{t.waiter.fullName}</strong></p>}
                {t.orders.length > 0 && (
                  <p style={{ fontSize: 12, color: '#2563EB' }}>Активных заказов: {t.orders.length}</p>
                )}

                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {t.status === 'FREE' && (
                    <button onClick={() => updateStatus.mutate({ id: t.id, status: 'OCCUPIED' })}
                      style={{ ...btnBase, background: '#FEE2E2', color: '#DC2626', fontSize: 11, height: 28 }}>Занять</button>
                  )}
                  {t.status === 'OCCUPIED' && (
                    <>
                      <button onClick={() => updateStatus.mutate({ id: t.id, status: 'FREE', waiterId: null })}
                        style={{ ...btnBase, background: '#DCFCE7', color: '#16A34A', fontSize: 11, height: 28 }}>Освободить</button>
                      <button onClick={() => updateStatus.mutate({ id: t.id, status: 'CLEANING' })}
                        style={{ ...btnBase, background: '#FEF9C3', color: '#A16207', fontSize: 11, height: 28 }}>Уборка</button>
                    </>
                  )}
                  {t.status === 'CLEANING' && (
                    <button onClick={() => updateStatus.mutate({ id: t.id, status: 'FREE', waiterId: null })}
                      style={{ ...btnBase, background: '#DCFCE7', color: '#16A34A', fontSize: 11, height: 28 }}>Готов</button>
                  )}
                  {t.status === 'RESERVED' && (
                    <button onClick={() => updateStatus.mutate({ id: t.id, status: 'FREE', waiterId: null })}
                      style={{ ...btnBase, background: '#DCFCE7', color: '#16A34A', fontSize: 11, height: 28 }}>Отмена брони</button>
                  )}
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && <div style={{ gridColumn: '1 / -1', padding: 32, textAlign: 'center', color: '#6B7280' }}>Нет столов</div>}
        </div>
      )}
    </div>
  );
}
