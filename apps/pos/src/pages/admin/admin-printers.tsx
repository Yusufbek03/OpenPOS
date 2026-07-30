import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Plus, Edit2, Trash2, X, Wifi, WifiOff, Loader2 } from 'lucide-react';

interface Printer {
  id: string; name: string; type: string; ipAddress: string | null; port: number | null;
  department: string; paperWidth: number; isActive: boolean; status: string;
  createdAt: string; _count: { stations: number; printJobs: number };
}

const pageStyle: React.CSSProperties = { padding: 24, display: 'flex', flexDirection: 'column', gap: 20 };
const cardStyle: React.CSSProperties = { background: '#FFFFFF', borderRadius: 16, border: '1px solid #E5E7EB', overflow: 'hidden' };
const inputStyle: React.CSSProperties = { width: '100%', height: 40, padding: '0 12px', borderRadius: 10, border: '1px solid #E5E7EB', fontSize: 14, boxSizing: 'border-box', outline: 'none' };
const labelStyle: React.CSSProperties = { display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 };
const btnPrimary: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#2563EB', color: '#FFFFFF', borderRadius: 10, border: 'none', fontSize: 14, fontWeight: 500, cursor: 'pointer' };
const thStyle: React.CSSProperties = { padding: '12px 12px', textAlign: 'left', fontSize: 13, color: '#6B7280', borderBottom: '1px solid #E5E7EB', fontWeight: 500 };
const tdStyle: React.CSSProperties = { padding: '12px', fontSize: 14, borderBottom: '1px solid #F3F4F6' };

const DEPARTMENTS = ['KITCHEN', 'BAR', 'REGISTER', 'WAREHOUSE', 'OFFICE'];
const TYPES = ['RECEIPT', 'KITCHEN_TICKET', 'BAR_TICKET', 'DESSERT_TICKET', 'X_REPORT', 'Z_REPORT'];

const deptLabel: Record<string, string> = { KITCHEN: 'Кухня', BAR: 'Бар', REGISTER: 'Касса', WAREHOUSE: 'Склад', OFFICE: 'Офис' };
const typeLabel: Record<string, string> = { RECEIPT: 'Чек', KITCHEN_TICKET: 'Кухонный талон', BAR_TICKET: 'Барный талон', DESSERT_TICKET: 'Десертный талон', X_REPORT: 'X-отчёт', Z_REPORT: 'Z-отчёт' };

export function AdminPrinters() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingPrinter, setEditingPrinter] = useState<Printer | null>(null);
  const [form, setForm] = useState({ name: '', type: 'RECEIPT', ipAddress: '', port: '9100', department: 'KITCHEN', paperWidth: '80', isActive: true });
  const [testStatus, setTestStatus] = useState<Record<string, 'idle' | 'testing' | 'ok' | 'fail'>>({});

  const { data: printers = [], isLoading } = useQuery({
    queryKey: ['admin-printers', search],
    queryFn: async () => {
      const { data } = await api.get('/admin/printers', { params: { department: search || undefined } });
      return (data || []) as Printer[];
    },
  });

  const savePrinter = useMutation({
    mutationFn: async (formData: typeof form) => {
      const payload = {
        name: formData.name,
        type: formData.type,
        ipAddress: formData.ipAddress || null,
        port: formData.port ? Number(formData.port) : null,
        department: formData.department,
        paperWidth: Number(formData.paperWidth),
        isActive: formData.isActive,
      };
      if (editingPrinter) return api.patch(`/admin/printers/${editingPrinter.id}`, payload);
      return api.post('/admin/printers', payload);
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-printers'] }); setShowForm(false); setEditingPrinter(null); resetForm(); },
  });

  const deletePrinter = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/printers/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-printers'] }),
  });

  const resetForm = () => setForm({ name: '', type: 'RECEIPT', ipAddress: '', port: '9100', department: 'KITCHEN', paperWidth: '80', isActive: true });

  const startEdit = (p: Printer) => {
    setEditingPrinter(p);
    setForm({ name: p.name, type: p.type, ipAddress: p.ipAddress || '', port: p.port?.toString() || '9100', department: p.department, paperWidth: p.paperWidth.toString(), isActive: p.isActive });
    setShowForm(true);
  };

  const testConnection = async (id: string) => {
    setTestStatus((prev) => ({ ...prev, [id]: 'testing' }));
    try {
      const { data } = await api.post(`/admin/printers/${id}/test`);
      setTestStatus((prev) => ({ ...prev, [id]: data.connected ? 'ok' : 'fail' }));
    } catch {
      setTestStatus((prev) => ({ ...prev, [id]: 'fail' }));
    }
    setTimeout(() => setTestStatus((prev) => ({ ...prev, [id]: 'idle' })), 3000);
  };

  return (
    <div style={pageStyle}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>Принтеры</h1>
        <button onClick={() => { resetForm(); setEditingPrinter(null); setShowForm(true); }} style={btnPrimary}>
          <Plus style={{ width: 16, height: 16 }} /> Добавить принтер
        </button>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {['', ...DEPARTMENTS].map((d) => (
          <button key={d} onClick={() => setSearch(d)} style={{ padding: '6px 14px', borderRadius: 20, border: '1px solid #E5E7EB', background: search === d ? '#2563EB' : '#FFFFFF', color: search === d ? '#FFFFFF' : '#374151', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
            {d ? deptLabel[d] || d : 'Все'}
          </button>
        ))}
      </div>

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)' }}>
          <div style={{ background: '#FFFFFF', borderRadius: 16, width: '100%', maxWidth: 480, margin: '0 16px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', maxHeight: '90vh', overflow: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #E5E7EB' }}>
              <h2 style={{ fontSize: 16, fontWeight: 600 }}>{editingPrinter ? 'Редактировать принтер' : 'Новый принтер'}</h2>
              <button onClick={() => { setShowForm(false); setEditingPrinter(null); }} style={{ padding: 4, background: 'none', border: 'none', cursor: 'pointer', borderRadius: 6 }}><X style={{ width: 20, height: 20 }} /></button>
            </div>
            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div><label style={labelStyle}>Название *</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={inputStyle} placeholder="Например: Кассовый принтер" /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>Тип *</label>
                  <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} style={{ ...inputStyle, background: '#FFFFFF' }}>
                    {TYPES.map((t) => <option key={t} value={t}>{typeLabel[t] || t}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Отдел *</label>
                  <select value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} style={{ ...inputStyle, background: '#FFFFFF' }}>
                    {DEPARTMENTS.map((d) => <option key={d} value={d}>{deptLabel[d] || d}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 12 }}>
                <div><label style={labelStyle}>IP-адрес</label><input value={form.ipAddress} onChange={(e) => setForm({ ...form, ipAddress: e.target.value })} style={inputStyle} placeholder="192.168.1.100" /></div>
                <div><label style={labelStyle}>Порт</label><input value={form.port} onChange={(e) => setForm({ ...form, port: e.target.value })} style={inputStyle} placeholder="9100" /></div>
                <div><label style={labelStyle}>Ширина (мм)</label><input value={form.paperWidth} onChange={(e) => setForm({ ...form, paperWidth: e.target.value })} style={inputStyle} placeholder="80" /></div>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
                <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} style={{ width: 16, height: 16, borderRadius: 4 }} />
                Активен
              </label>
              <button onClick={() => savePrinter.mutate(form)} disabled={!form.name || savePrinter.isPending} style={{ ...btnPrimary, width: '100%', height: 44, justifyContent: 'center', opacity: !form.name || savePrinter.isPending ? 0.5 : 1 }}>
                {savePrinter.isPending ? 'Сохранение...' : editingPrinter ? 'Сохранить' : 'Создать'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={cardStyle}>
        {isLoading ? (
          <div style={{ padding: 32, textAlign: 'center', color: '#6B7280' }}>Загрузка...</div>
        ) : printers.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', color: '#6B7280' }}>Нет принтеров</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={thStyle}>Название</th>
                <th style={thStyle}>Тип</th>
                <th style={thStyle}>Отдел</th>
                <th style={thStyle}>Адрес</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>Бумага</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>Статус</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Действия</th>
              </tr>
            </thead>
            <tbody>
              {printers.map((p) => (
                <tr key={p.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 8, background: p.isActive ? '#EFF6FF' : '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {p.department === 'KITCHEN' ? '🍳' : p.department === 'BAR' ? '🍸' : p.department === 'REGISTER' ? '🧾' : '🖨️'}
                      </div>
                      <div>
                        <div style={{ fontWeight: 500 }}>{p.name}</div>
                        <div style={{ fontSize: 12, color: '#9CA3AF' }}>{p._count.printJobs} печатей</div>
                      </div>
                    </div>
                  </td>
                  <td style={tdStyle}><span style={{ fontSize: 13, color: '#6B7280' }}>{typeLabel[p.type] || p.type}</span></td>
                  <td style={tdStyle}>
                    <span style={{ fontSize: 12, padding: '3px 8px', borderRadius: 6, background: '#F3F4F6', color: '#374151', fontWeight: 500 }}>
                      {deptLabel[p.department] || p.department}
                    </span>
                  </td>
                  <td style={{ ...tdStyle, fontSize: 13, color: '#6B7280', fontFamily: 'monospace' }}>
                    {p.ipAddress ? `${p.ipAddress}:${p.port || 9100}` : '—'}
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'center', fontSize: 13 }}>{p.paperWidth}мм</td>
                  <td style={{ ...tdStyle, textAlign: 'center' }}>
                    <span style={{ fontSize: 12, padding: '4px 10px', borderRadius: 20, fontWeight: 500, background: p.isActive ? '#DCFCE7' : '#F3F4F6', color: p.isActive ? '#16A34A' : '#6B7280' }}>
                      {p.isActive ? 'Активен' : 'Неактивен'}
                    </span>
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}>
                    <button onClick={() => testConnection(p.id)} disabled={testStatus[p.id] === 'testing'} title="Тест подключения" style={{ padding: 6, background: 'none', border: 'none', cursor: 'pointer', borderRadius: 6, color: testStatus[p.id] === 'ok' ? '#16A34A' : testStatus[p.id] === 'fail' ? '#EF4444' : '#6B7280' }}>
                      {testStatus[p.id] === 'testing' ? <Loader2 style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} /> : testStatus[p.id] === 'ok' ? <Wifi style={{ width: 16, height: 16 }} /> : testStatus[p.id] === 'fail' ? <WifiOff style={{ width: 16, height: 16 }} /> : <Wifi style={{ width: 16, height: 16 }} />}
                    </button>
                    <button onClick={() => startEdit(p)} style={{ padding: 6, background: 'none', border: 'none', cursor: 'pointer', borderRadius: 6, color: '#6B7280' }}><Edit2 style={{ width: 16, height: 16 }} /></button>
                    <button onClick={() => { if (confirm('Удалить принтер?')) deletePrinter.mutate(p.id); }} style={{ padding: 6, background: 'none', border: 'none', cursor: 'pointer', borderRadius: 6, color: '#EF4444' }}><Trash2 style={{ width: 16, height: 16 }} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
