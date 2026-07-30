import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Plus, Search, Edit2, Trash2, X, Phone, Mail, User } from 'lucide-react';

interface Supplier {
  id: string; name: string; inn: string | null; phone: string | null;
  email: string | null; address: string | null; contactPerson: string | null;
  createdAt: string;
}

const pageStyle: React.CSSProperties = { padding: 24, display: 'flex', flexDirection: 'column', gap: 20 };
const cardStyle: React.CSSProperties = { background: '#FFFFFF', borderRadius: 16, border: '1px solid #E5E7EB', overflow: 'hidden' };
const inputStyle: React.CSSProperties = { width: '100%', height: 40, padding: '0 12px', borderRadius: 10, border: '1px solid #E5E7EB', fontSize: 14, boxSizing: 'border-box', outline: 'none' };
const labelStyle: React.CSSProperties = { display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 };
const btnPrimary: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#2563EB', color: '#FFFFFF', borderRadius: 10, border: 'none', fontSize: 14, fontWeight: 500, cursor: 'pointer' };
const thStyle: React.CSSProperties = { padding: '12px 12px', textAlign: 'left', fontSize: 13, color: '#6B7280', borderBottom: '1px solid #E5E7EB', fontWeight: 500 };
const tdStyle: React.CSSProperties = { padding: '12px', fontSize: 14, borderBottom: '1px solid #F3F4F6' };

export function AdminSuppliers() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [form, setForm] = useState({ name: '', inn: '', phone: '', email: '', address: '', contactPerson: '' });

  const { data: suppliersData, isLoading } = useQuery({
    queryKey: ['admin-suppliers', search],
    queryFn: async () => {
      const { data } = await api.get('/admin/suppliers', { params: { limit: 200, search: search || undefined } });
      return data;
    },
  });

  const saveSupplier = useMutation({
    mutationFn: async (formData: typeof form) => {
      const payload = {
        name: formData.name,
        inn: formData.inn || null,
        phone: formData.phone || null,
        email: formData.email || null,
        address: formData.address || null,
        contactPerson: formData.contactPerson || null,
      };
      if (editing) return api.patch(`/admin/suppliers/${editing.id}`, payload);
      return api.post('/admin/suppliers', payload);
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-suppliers'] }); setShowForm(false); setEditing(null); resetForm(); },
  });

  const deleteSupplier = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/suppliers/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-suppliers'] }),
  });

  const resetForm = () => setForm({ name: '', inn: '', phone: '', email: '', address: '', contactPerson: '' });

  const startEdit = (s: Supplier) => {
    setEditing(s);
    setForm({ name: s.name, inn: s.inn || '', phone: s.phone || '', email: s.email || '', address: s.address || '', contactPerson: s.contactPerson || '' });
    setShowForm(true);
  };

  const suppliers = suppliersData?.suppliers || suppliersData?.items || [];

  return (
    <div style={pageStyle}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>Поставщики</h1>
        <button onClick={() => { resetForm(); setEditing(null); setShowForm(true); }} style={btnPrimary}>
          <Plus style={{ width: 16, height: 16 }} /> Добавить поставщика
        </button>
      </div>

      <div style={{ position: 'relative', maxWidth: 384 }}>
        <Search style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: '#9CA3AF', pointerEvents: 'none' }} />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Поиск по названию, ИНН, контакту..." style={{ ...inputStyle, paddingLeft: 36 }} />
      </div>

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)' }}>
          <div style={{ background: '#FFFFFF', borderRadius: 16, width: '100%', maxWidth: 480, margin: '0 16px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', maxHeight: '90vh', overflow: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #E5E7EB' }}>
              <h2 style={{ fontSize: 16, fontWeight: 600 }}>{editing ? 'Редактировать поставщика' : 'Новый поставщик'}</h2>
              <button onClick={() => { setShowForm(false); setEditing(null); }} style={{ padding: 4, background: 'none', border: 'none', cursor: 'pointer', borderRadius: 6 }}><X style={{ width: 20, height: 20 }} /></button>
            </div>
            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div><label style={labelStyle}>Название *</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={inputStyle} placeholder="ООО 'Поставщик'" /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div><label style={labelStyle}>ИНН</label><input value={form.inn} onChange={(e) => setForm({ ...form, inn: e.target.value })} style={inputStyle} /></div>
                <div><label style={labelStyle}>Контактное лицо</label><input value={form.contactPerson} onChange={(e) => setForm({ ...form, contactPerson: e.target.value })} style={inputStyle} /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div><label style={labelStyle}>Телефон</label><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} style={inputStyle} /></div>
                <div><label style={labelStyle}>Email</label><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} style={inputStyle} /></div>
              </div>
              <div><label style={labelStyle}>Адрес</label><input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} style={inputStyle} /></div>
              <button onClick={() => saveSupplier.mutate(form)} disabled={!form.name || saveSupplier.isPending} style={{ ...btnPrimary, width: '100%', height: 44, justifyContent: 'center', opacity: !form.name || saveSupplier.isPending ? 0.5 : 1 }}>
                {saveSupplier.isPending ? 'Сохранение...' : editing ? 'Сохранить' : 'Создать'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={cardStyle}>
        {isLoading ? (
          <div style={{ padding: 32, textAlign: 'center', color: '#6B7280' }}>Загрузка...</div>
        ) : suppliers.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', color: '#6B7280' }}>Нет поставщиков</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={thStyle}>Поставщик</th>
                <th style={thStyle}>ИНН</th>
                <th style={thStyle}>Контакты</th>
                <th style={thStyle}>Контактное лицо</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Действия</th>
              </tr>
            </thead>
            <tbody>
              {suppliers.map((s: Supplier) => (
                <tr key={s.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🏭</div>
                      <div>
                        <div style={{ fontWeight: 500 }}>{s.name}</div>
                        {s.address && <div style={{ fontSize: 12, color: '#9CA3AF', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.address}</div>}
                      </div>
                    </div>
                  </td>
                  <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: 13, color: '#6B7280' }}>{s.inn || '—'}</td>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, fontSize: 13 }}>
                      {s.phone && <span style={{ color: '#374151' }}><Phone style={{ width: 12, height: 12, display: 'inline', marginRight: 4 }} />{s.phone}</span>}
                      {s.email && <span style={{ color: '#6B7280' }}><Mail style={{ width: 12, height: 12, display: 'inline', marginRight: 4 }} />{s.email}</span>}
                    </div>
                  </td>
                  <td style={tdStyle}>{s.contactPerson ? <span><User style={{ width: 12, height: 12, display: 'inline', marginRight: 4 }} />{s.contactPerson}</span> : '—'}</td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}>
                    <button onClick={() => startEdit(s)} style={{ padding: 6, background: 'none', border: 'none', cursor: 'pointer', borderRadius: 6, color: '#6B7280' }}><Edit2 style={{ width: 16, height: 16 }} /></button>
                    <button onClick={() => { if (confirm('Удалить поставщика?')) deleteSupplier.mutate(s.id); }} style={{ padding: 6, background: 'none', border: 'none', cursor: 'pointer', borderRadius: 6, color: '#EF4444' }}><Trash2 style={{ width: 16, height: 16 }} /></button>
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
