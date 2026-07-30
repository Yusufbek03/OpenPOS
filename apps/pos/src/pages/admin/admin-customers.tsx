import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Plus, Search, Edit2, Trash2, X, Gift, Star, Phone, Mail } from 'lucide-react';

interface Customer {
  id: string; fullName: string; phone: string | null; email: string | null;
  birthDate: string | null; status: string; bonusBalance: string; totalSpent: string;
  totalOrders: number; lastVisitAt: string | null; notes: string | null;
  createdAt: string;
}

interface CustomerStats {
  total: number;
  byStatus: Record<string, number>;
  totalBonusBalance: number;
}

const pageStyle: React.CSSProperties = { padding: 24, display: 'flex', flexDirection: 'column', gap: 20 };
const cardStyle: React.CSSProperties = { background: '#FFFFFF', borderRadius: 16, border: '1px solid #E5E7EB', overflow: 'hidden' };
const inputStyle: React.CSSProperties = { width: '100%', height: 40, padding: '0 12px', borderRadius: 10, border: '1px solid #E5E7EB', fontSize: 14, boxSizing: 'border-box', outline: 'none' };
const labelStyle: React.CSSProperties = { display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 };
const btnPrimary: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#2563EB', color: '#FFFFFF', borderRadius: 10, border: 'none', fontSize: 14, fontWeight: 500, cursor: 'pointer' };
const thStyle: React.CSSProperties = { padding: '12px 12px', textAlign: 'left', fontSize: 13, color: '#6B7280', borderBottom: '1px solid #E5E7EB', fontWeight: 500 };
const tdStyle: React.CSSProperties = { padding: '12px', fontSize: 14, borderBottom: '1px solid #F3F4F6' };

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  NEW: { label: 'Новый', color: '#2563EB', bg: '#EFF6FF' },
  REGULAR: { label: 'Постоянный', color: '#16A34A', bg: '#DCFCE7' },
  VIP: { label: 'VIP', color: '#F59E0B', bg: '#FEF3C7' },
  BLOCKED: { label: 'Заблокирован', color: '#EF4444', bg: '#FEE2E2' },
};

export function AdminCustomers() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [form, setForm] = useState<{ fullName: string; phone: string; email: string; birthDate: string; notes: string }>({ fullName: '', phone: '', email: '', birthDate: '', notes: '' });
  const [bonusModal, setBonusModal] = useState<{ customer: Customer; type: 'accrue' | 'writeoff' } | null>(null);
  const [bonusAmount, setBonusAmount] = useState('');

  const { data: customersData, isLoading } = useQuery({
    queryKey: ['admin-customers', search, filterStatus],
    queryFn: async () => {
      const { data } = await api.get('/admin/customers', { params: { limit: 100, search: search || undefined, status: filterStatus || undefined } });
      return data;
    },
  });

  const { data: stats } = useQuery({
    queryKey: ['admin-customers-stats'],
    queryFn: async () => {
      const { data } = await api.get('/admin/customers/stats');
      return data as CustomerStats;
    },
  });

  const saveCustomer = useMutation({
    mutationFn: async (formData: typeof form) => {
      const payload = {
        fullName: formData.fullName,
        phone: formData.phone || null,
        email: formData.email || null,
        birthDate: formData.birthDate || null,
        notes: formData.notes || null,
      };
      if (editing) return api.patch(`/admin/customers/${editing.id}`, payload);
      return api.post('/admin/customers', payload);
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-customers'] }); setShowForm(false); setEditing(null); resetForm(); },
  });

  const deleteCustomer = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/customers/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-customers'] }),
  });

  const bonusMutation = useMutation({
    mutationFn: async () => {
      if (!bonusModal || !bonusAmount) return;
      const url = bonusModal.type === 'accrue'
        ? `/admin/customers/${bonusModal.customer.id}/bonus/accrue`
        : `/admin/customers/${bonusModal.customer.id}/bonus/writeoff`;
      return api.post(url, { amount: Number(bonusAmount) });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-customers'] });
      queryClient.invalidateQueries({ queryKey: ['admin-customers-stats'] });
      setBonusModal(null); setBonusAmount('');
    },
  });

  const resetForm = () => setForm({ fullName: '', phone: '', email: '', birthDate: '', notes: '' });

  const startEdit = (c: Customer) => {
    setEditing(c);
    setForm({ fullName: c.fullName, phone: c.phone || '', email: c.email || '', birthDate: c.birthDate ? c.birthDate.split('T')[0] ?? '' : '', notes: c.notes || '' });
    setShowForm(true);
  };

  const customers = customersData?.customers || [];

  return (
    <div style={pageStyle}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>Клиенты</h1>
        <button onClick={() => { resetForm(); setEditing(null); setShowForm(true); }} style={btnPrimary}>
          <Plus style={{ width: 16, height: 16 }} /> Добавить клиента
        </button>
      </div>

      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {[
            { label: 'Всего клиентов', value: stats.total, icon: '👥', color: '#2563EB' },
            { label: 'Новые', value: stats.byStatus.NEW || 0, icon: '🆕', color: '#0891B2' },
            { label: 'VIP', value: stats.byStatus.VIP || 0, icon: '⭐', color: '#F59E0B' },
            { label: 'Бонусов выдано', value: `${stats.totalBonusBalance.toLocaleString('uz-UZ')}`, icon: '🎁', color: '#16A34A' },
          ].map((s) => (
            <div key={s.label} style={{ ...cardStyle, padding: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: `${s.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>{s.icon}</div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 700 }}>{s.value}</div>
                <div style={{ fontSize: 12, color: '#6B7280' }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 384 }}>
          <Search style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: '#9CA3AF', pointerEvents: 'none' }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Поиск по имени, телефону..." style={{ ...inputStyle, paddingLeft: 36 }} />
        </div>
        {['', 'NEW', 'REGULAR', 'VIP', 'BLOCKED'].map((s) => (
          <button key={s} onClick={() => setFilterStatus(s)} style={{ padding: '6px 14px', borderRadius: 20, border: '1px solid #E5E7EB', background: filterStatus === s ? '#2563EB' : '#FFFFFF', color: filterStatus === s ? '#FFFFFF' : '#374151', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
            {s ? STATUS_MAP[s]?.label : 'Все'}
          </button>
        ))}
      </div>

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)' }}>
          <div style={{ background: '#FFFFFF', borderRadius: 16, width: '100%', maxWidth: 480, margin: '0 16px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', maxHeight: '90vh', overflow: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #E5E7EB' }}>
              <h2 style={{ fontSize: 16, fontWeight: 600 }}>{editing ? 'Редактировать клиента' : 'Новый клиент'}</h2>
              <button onClick={() => { setShowForm(false); setEditing(null); }} style={{ padding: 4, background: 'none', border: 'none', cursor: 'pointer', borderRadius: 6 }}><X style={{ width: 20, height: 20 }} /></button>
            </div>
            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div><label style={labelStyle}>Имя *</label><input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} style={inputStyle} placeholder="Иван Петров" /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div><label style={labelStyle}>Телефон</label><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} style={inputStyle} placeholder="+998901234567" /></div>
                <div><label style={labelStyle}>Email</label><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} style={inputStyle} /></div>
              </div>
              <div><label style={labelStyle}>Дата рождения</label><input type="date" value={form.birthDate} onChange={(e) => setForm({ ...form, birthDate: e.target.value })} style={inputStyle} /></div>
              <div><label style={labelStyle}>Заметки</label><textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} style={{ ...inputStyle, height: 72, padding: '8px 12px', resize: 'vertical' }} placeholder="Любимый напиток, особые пожелания..." /></div>
              <button onClick={() => saveCustomer.mutate(form)} disabled={!form.fullName || saveCustomer.isPending} style={{ ...btnPrimary, width: '100%', height: 44, justifyContent: 'center', opacity: !form.fullName || saveCustomer.isPending ? 0.5 : 1 }}>
                {saveCustomer.isPending ? 'Сохранение...' : editing ? 'Сохранить' : 'Создать'}
              </button>
            </div>
          </div>
        </div>
      )}

      {bonusModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)' }}>
          <div style={{ background: '#FFFFFF', borderRadius: 16, width: '100%', maxWidth: 380, margin: '0 16px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #E5E7EB' }}>
              <h2 style={{ fontSize: 16, fontWeight: 600 }}>
                {bonusModal.type === 'accrue' ? '🎁 Начислить бонусы' : '💳 Списать бонусы'}
              </h2>
              <button onClick={() => { setBonusModal(null); setBonusAmount(''); }} style={{ padding: 4, background: 'none', border: 'none', cursor: 'pointer', borderRadius: 6 }}><X style={{ width: 20, height: 20 }} /></button>
            </div>
            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ fontSize: 14, color: '#6B7280' }}>
                Клиент: <strong>{bonusModal.customer.fullName}</strong>
              </div>
              <div style={{ fontSize: 14, color: '#6B7280' }}>
                Текущий баланс: <strong>{Number(bonusModal.customer.bonusBalance).toLocaleString('uz-UZ')} бонусов</strong>
              </div>
              <div>
                <label style={labelStyle}>Сумма</label>
                <input type="number" value={bonusAmount} onChange={(e) => setBonusAmount(e.target.value)} style={inputStyle} placeholder="Введите сумму" min="1" />
              </div>
              <button onClick={() => bonusMutation.mutate()} disabled={!bonusAmount || Number(bonusAmount) <= 0 || bonusMutation.isPending}
                style={{ ...btnPrimary, width: '100%', height: 44, justifyContent: 'center', background: bonusModal.type === 'accrue' ? '#16A34A' : '#EF4444', opacity: !bonusAmount || Number(bonusAmount) <= 0 ? 0.5 : 1 }}>
                {bonusMutation.isPending ? 'Обработка...' : bonusModal.type === 'accrue' ? 'Начислить' : 'Списать'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={cardStyle}>
        {isLoading ? (
          <div style={{ padding: 32, textAlign: 'center', color: '#6B7280' }}>Загрузка...</div>
        ) : customers.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', color: '#6B7280' }}>Нет клиентов</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={thStyle}>Клиент</th>
                <th style={thStyle}>Контакты</th>
                <th style={thStyle}>Статус</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Бонусы</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Покупок</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Потрачено</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Действия</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c: Customer) => {
                const st = STATUS_MAP[c.status] ?? STATUS_MAP.NEW;
                if (!st) return null;
                return (
                  <tr key={c.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: st.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: st.color }}>
                          {c.fullName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 500 }}>{c.fullName}</div>
                          {c.birthDate && <div style={{ fontSize: 12, color: '#9CA3AF' }}>🎂 {new Date(c.birthDate).toLocaleDateString('ru-RU')}</div>}
                        </div>
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, fontSize: 13 }}>
                        {c.phone && <span style={{ color: '#374151' }}><Phone style={{ width: 12, height: 12, display: 'inline', marginRight: 4 }} />{c.phone}</span>}
                        {c.email && <span style={{ color: '#6B7280' }}><Mail style={{ width: 12, height: 12, display: 'inline', marginRight: 4 }} />{c.email}</span>}
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <span style={{ fontSize: 12, padding: '4px 10px', borderRadius: 20, fontWeight: 500, background: st.bg, color: st.color }}>{st.label}</span>
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600, color: '#16A34A' }}>
                      {Number(c.bonusBalance).toLocaleString('uz-UZ')}
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>{c.totalOrders}</td>
                    <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 500 }}>{Number(c.totalSpent).toLocaleString('uz-UZ')} сўм</td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>
                      <button onClick={() => setBonusModal({ customer: c, type: 'accrue' })} title="Начислить бонусы" style={{ padding: 6, background: 'none', border: 'none', cursor: 'pointer', borderRadius: 6, color: '#16A34A' }}><Gift style={{ width: 16, height: 16 }} /></button>
                      <button onClick={() => setBonusModal({ customer: c, type: 'writeoff' })} title="Списать бонусы" style={{ padding: 6, background: 'none', border: 'none', cursor: 'pointer', borderRadius: 6, color: '#F59E0B' }}><Star style={{ width: 16, height: 16 }} /></button>
                      <button onClick={() => startEdit(c)} style={{ padding: 6, background: 'none', border: 'none', cursor: 'pointer', borderRadius: 6, color: '#6B7280' }}><Edit2 style={{ width: 16, height: 16 }} /></button>
                      <button onClick={() => { if (confirm('Удалить клиента?')) deleteCustomer.mutate(c.id); }} style={{ padding: 6, background: 'none', border: 'none', cursor: 'pointer', borderRadius: 6, color: '#EF4444' }}><Trash2 style={{ width: 16, height: 16 }} /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
