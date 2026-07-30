import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Plus, Edit2, Trash2, X } from 'lucide-react';

interface Station {
  id: string; name: string; sortOrder: number; isActive: boolean;
  printerId: string | null; printer?: { id: string; name: string } | null;
  _count: { products: number; tickets: number };
}

interface Printer { id: string; name: string; department: string; isActive: boolean; }

const pageStyle: React.CSSProperties = { padding: 24, display: 'flex', flexDirection: 'column', gap: 20 };
const cardStyle: React.CSSProperties = { background: '#FFFFFF', borderRadius: 16, border: '1px solid #E5E7EB', overflow: 'hidden' };
const inputStyle: React.CSSProperties = { width: '100%', height: 40, padding: '0 12px', borderRadius: 10, border: '1px solid #E5E7EB', fontSize: 14, boxSizing: 'border-box', outline: 'none' };
const labelStyle: React.CSSProperties = { display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 };
const btnPrimary: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#2563EB', color: '#FFFFFF', borderRadius: 10, border: 'none', fontSize: 14, fontWeight: 500, cursor: 'pointer' };

const STATION_ICONS: Record<string, string> = {
  'Кухня': '🍳', 'Kitchen': '🍳', 'Бар': '🍸', 'Bar': '🍸',
  'Десерты': '🍰', 'Dessert': '🍰', 'Гриль': '🔥', 'Grill': '🔥',
  'Выпечка': '🍞', 'Bakery': '🍞', 'Касса': '🧾', 'Кофе': '☕',
};

function getStationIcon(name: string): string {
  for (const [key, icon] of Object.entries(STATION_ICONS)) {
    if (name.toLowerCase().includes(key.toLowerCase())) return icon;
  }
  return '🍽️';
}

export function AdminStations() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Station | null>(null);
  const [form, setForm] = useState({ name: '', printerId: '', sortOrder: '0', isActive: true });

  const { data: stations = [], isLoading } = useQuery({
    queryKey: ['admin-stations'],
    queryFn: async () => {
      const { data } = await api.get('/admin/kitchen/stations');
      return (data || []) as Station[];
    },
  });

  const { data: printers = [] } = useQuery({
    queryKey: ['admin-printers'],
    queryFn: async () => {
      const { data } = await api.get('/admin/printers', { params: { department: 'KITCHEN' } });
      return (data || []) as Printer[];
    },
  });

  const saveStation = useMutation({
    mutationFn: async (formData: typeof form) => {
      const payload = {
        name: formData.name,
        printerId: formData.printerId || null,
        sortOrder: Number(formData.sortOrder),
        isActive: String(formData.isActive),
      };
      if (editing) return api.patch(`/admin/kitchen/stations/${editing.id}`, payload);
      return api.post('/admin/kitchen/stations', payload);
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-stations'] }); setShowForm(false); setEditing(null); resetForm(); },
  });

  const deleteStation = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/kitchen/stations/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-stations'] }),
  });

  const resetForm = () => setForm({ name: '', printerId: '', sortOrder: '0', isActive: true });

  const startEdit = (s: Station) => {
    setEditing(s);
    setForm({ name: s.name, printerId: s.printerId || '', sortOrder: s.sortOrder.toString(), isActive: s.isActive });
    setShowForm(true);
  };

  return (
    <div style={pageStyle}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>Кухонные станции</h1>
        <button onClick={() => { resetForm(); setEditing(null); setShowForm(true); }} style={btnPrimary}>
          <Plus style={{ width: 16, height: 16 }} /> Добавить станцию
        </button>
      </div>

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)' }}>
          <div style={{ background: '#FFFFFF', borderRadius: 16, width: '100%', maxWidth: 420, margin: '0 16px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #E5E7EB' }}>
              <h2 style={{ fontSize: 16, fontWeight: 600 }}>{editing ? 'Редактировать станцию' : 'Новая станция'}</h2>
              <button onClick={() => { setShowForm(false); setEditing(null); }} style={{ padding: 4, background: 'none', border: 'none', cursor: 'pointer', borderRadius: 6 }}><X style={{ width: 20, height: 20 }} /></button>
            </div>
            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div><label style={labelStyle}>Название станции *</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={inputStyle} placeholder="Например: Основная кухня, Бар, Десерты" /></div>
              <div>
                <label style={labelStyle}>Принтер (кухонный)</label>
                <select value={form.printerId} onChange={(e) => setForm({ ...form, printerId: e.target.value })} style={{ ...inputStyle, background: '#FFFFFF' }}>
                  <option value="">Без принтера</option>
                  {printers.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div><label style={labelStyle}>Порядок</label><input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: e.target.value })} style={inputStyle} /></div>
                <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, paddingBottom: 8 }}>
                    <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} style={{ width: 16, height: 16, borderRadius: 4 }} />
                    Активна
                  </label>
                </div>
              </div>
              <button onClick={() => saveStation.mutate(form)} disabled={!form.name || saveStation.isPending} style={{ ...btnPrimary, width: '100%', height: 44, justifyContent: 'center', opacity: !form.name || saveStation.isPending ? 0.5 : 1 }}>
                {saveStation.isPending ? 'Сохранение...' : editing ? 'Сохранить' : 'Создать'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={cardStyle}>
        {isLoading ? (
          <div style={{ padding: 32, textAlign: 'center', color: '#6B7280' }}>Загрузка...</div>
        ) : stations.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', color: '#6B7280' }}>Нет станций</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16, padding: 20 }}>
            {stations.map((s) => (
              <div key={s.id} style={{ background: s.isActive ? '#FFFFFF' : '#F9FAFB', borderRadius: 12, border: '1px solid #E5E7EB', padding: 16, display: 'flex', flexDirection: 'column', gap: 12, opacity: s.isActive ? 1 : 0.6 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                      {getStationIcon(s.name)}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 15 }}>{s.name}</div>
                      <div style={{ fontSize: 12, color: '#9CA3AF' }}>Порядок: {s.sortOrder}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button onClick={() => startEdit(s)} style={{ padding: 6, background: 'none', border: 'none', cursor: 'pointer', borderRadius: 6, color: '#6B7280' }}><Edit2 style={{ width: 16, height: 16 }} /></button>
                    <button onClick={() => { if (confirm('Удалить станцию?')) deleteStation.mutate(s.id); }} style={{ padding: 6, background: 'none', border: 'none', cursor: 'pointer', borderRadius: 6, color: '#EF4444' }}><Trash2 style={{ width: 16, height: 16 }} /></button>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 12, fontSize: 13, color: '#6B7280' }}>
                  <span>🖨️ {s.printer?.name || 'Без принтера'}</span>
                  <span>📦 {s._count.products} товаров</span>
                  <span>📋 {s._count.tickets} талонов</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ ...cardStyle, padding: 20 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Как работает маршрутизация</h2>
        <p style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.6 }}>
          Каждый товар привязывается к станции через поле «Кухонная станция» в настройках товара.
          При отправке заказа на кухню автоматически создаются тикеты по станциям — каждый принтер получает только свои блюда.
          Настройте станции и принтеры, затем привяжите товары в разделе «Товары».
        </p>
      </div>
    </div>
  );
}
