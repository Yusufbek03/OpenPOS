import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Plus, Search, Edit2, Trash2, X, UserCheck, UserX } from 'lucide-react';

interface User {
  id: string; fullName: string; username: string; isActive: boolean;
  branchId: string | null; lastLoginAt: string | null; createdAt: string;
  role: { id: string; name: string };
}

const ROLES = ['OWNER', 'ADMINISTRATOR', 'CASHIER', 'WAITER', 'COOK'];
const ROLE_LABELS: Record<string, string> = { OWNER: 'Владелец', ADMINISTRATOR: 'Администратор', CASHIER: 'Кассир', WAITER: 'Официант', COOK: 'Повар' };

const pageStyle: React.CSSProperties = { padding: 24, display: 'flex', flexDirection: 'column', gap: 20 };
const cardStyle: React.CSSProperties = { background: '#FFFFFF', borderRadius: 16, border: '1px solid #E5E7EB', overflow: 'hidden' };
const inputStyle: React.CSSProperties = { width: '100%', height: 40, padding: '0 12px', borderRadius: 10, border: '1px solid #E5E7EB', fontSize: 14, boxSizing: 'border-box', outline: 'none' };
const labelStyle: React.CSSProperties = { display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 };
const btnPrimary: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#2563EB', color: '#FFFFFF', borderRadius: 10, border: 'none', fontSize: 14, fontWeight: 500, cursor: 'pointer' };
const thStyle: React.CSSProperties = { padding: '12px 12px', textAlign: 'left', fontSize: 13, color: '#6B7280', borderBottom: '1px solid #E5E7EB', fontWeight: 500 };
const tdStyle: React.CSSProperties = { padding: '12px', fontSize: 14, borderBottom: '1px solid #F3F4F6' };

export function AdminEmployees() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form, setForm] = useState({ fullName: '', username: '', password: '', role: 'CASHIER', pinCode: '' });

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin-users', search],
    queryFn: async () => {
      const { data } = await api.get('/users', { params: { limit: 200, search: search || undefined } });
      return data.users as User[];
    },
  });

  const saveUser = useMutation({
    mutationFn: async (f: typeof form) => {
      const payload = { ...f, password: f.password || undefined, pinCode: f.pinCode || undefined };
      if (editingUser) return api.patch(`/users/${editingUser.id}`, { fullName: f.fullName, role: f.role, pinCode: f.pinCode || undefined });
      return api.post('/users', payload);
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-users'] }); setShowForm(false); setEditingUser(null); setForm({ fullName: '', username: '', password: '', role: 'CASHIER', pinCode: '' }); },
  });

  const deleteUser = useMutation({
    mutationFn: (id: string) => api.delete(`/users/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
  });

  return (
    <div style={pageStyle}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>Сотрудники</h1>
        <button onClick={() => { setEditingUser(null); setForm({ fullName: '', username: '', password: '', role: 'CASHIER', pinCode: '' }); setShowForm(true); }} style={btnPrimary}>
          <Plus style={{ width: 16, height: 16 }} /> Добавить сотрудника
        </button>
      </div>

      <div style={{ position: 'relative', maxWidth: 384 }}>
        <Search style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: '#9CA3AF', pointerEvents: 'none' }} />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Поиск..." style={{ ...inputStyle, paddingLeft: 36 }} />
      </div>

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)' }}>
          <div style={{ background: '#FFFFFF', borderRadius: 16, width: '100%', maxWidth: 440, margin: '0 16px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #E5E7EB' }}>
              <h2 style={{ fontSize: 16, fontWeight: 600 }}>{editingUser ? 'Редактировать' : 'Новый сотрудник'}</h2>
              <button onClick={() => { setShowForm(false); setEditingUser(null); }} style={{ padding: 4, background: 'none', border: 'none', cursor: 'pointer', borderRadius: 6 }}><X style={{ width: 20, height: 20 }} /></button>
            </div>
            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div><label style={labelStyle}>Имя *</label><input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} style={inputStyle} /></div>
              {!editingUser && (
                <>
                  <div><label style={labelStyle}>Логин *</label><input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} style={inputStyle} /></div>
                  <div><label style={labelStyle}>Пароль *</label><input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} style={inputStyle} /></div>
                </>
              )}
              <div><label style={labelStyle}>Роль</label>
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} style={{ ...inputStyle, background: '#FFFFFF' }}>
                  {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                </select>
              </div>
              <div><label style={labelStyle}>PIN-код (для быстрого входа)</label><input value={form.pinCode} onChange={(e) => setForm({ ...form, pinCode: e.target.value })} style={inputStyle} /></div>
              <button onClick={() => saveUser.mutate(form)} disabled={!form.fullName || (!editingUser && (!form.username || !form.password))} style={{ ...btnPrimary, width: '100%', height: 44, justifyContent: 'center', opacity: !form.fullName || (!editingUser && (!form.username || !form.password)) ? 0.5 : 1 }}>
                {editingUser ? 'Сохранить' : 'Создать'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={cardStyle}>
        {isLoading ? <div style={{ padding: 32, textAlign: 'center', color: '#6B7280' }}>Загрузка...</div> : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={thStyle}>Сотрудник</th>
                <th style={thStyle}>Логин</th>
                <th style={thStyle}>Роль</th>
                <th style={thStyle}>Статус</th>
                <th style={thStyle}>Последний вход</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Действия</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                  <td style={tdStyle}>{u.fullName}</td>
                  <td style={{ ...tdStyle, color: '#6B7280', fontSize: 13 }}>{u.username}</td>
                  <td style={tdStyle}>{ROLE_LABELS[u.role.name] || u.role.name}</td>
                  <td style={tdStyle}>{u.isActive ? <UserCheck style={{ width: 16, height: 16, color: '#22C55E' }} /> : <UserX style={{ width: 16, height: 16, color: '#EF4444' }} />}</td>
                  <td style={{ ...tdStyle, fontSize: 13, color: '#6B7280' }}>{u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString('ru-RU') : 'Никогда'}</td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}>
                    <button onClick={() => { setEditingUser(u); setForm({ fullName: u.fullName, username: u.username, password: '', role: u.role.name, pinCode: '' }); setShowForm(true); }} style={{ padding: 6, background: 'none', border: 'none', cursor: 'pointer', borderRadius: 6 }}><Edit2 style={{ width: 16, height: 16, color: '#6B7280' }} /></button>
                    <button onClick={() => { if (confirm('Удалить сотрудника?')) deleteUser.mutate(u.id); }} style={{ padding: 6, background: 'none', border: 'none', cursor: 'pointer', borderRadius: 6 }}><Trash2 style={{ width: 16, height: 16, color: '#EF4444' }} /></button>
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
