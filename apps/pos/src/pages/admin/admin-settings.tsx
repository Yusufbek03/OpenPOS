import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Save, Building2, Upload, Globe, Lock, KeyRound, Check, AlertTriangle, Trash2 } from 'lucide-react';
import { API_BASE } from '@/lib/api-config';

interface Company {
  id: string; name: string; inn: string | null; address: string | null;
  phone: string | null; logoUrl: string | null;
  defaultCurrency: string; defaultLocale: string;
  branches?: Array<{ id: string; name: string; isActive: boolean }>;
}

const pageStyle: React.CSSProperties = { padding: 24, display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 640 };
const cardStyle: React.CSSProperties = { background: '#FFFFFF', borderRadius: 16, border: '1px solid #E5E7EB', overflow: 'hidden' };
const inputStyle: React.CSSProperties = { width: '100%', height: 40, padding: '0 12px', borderRadius: 10, border: '1px solid #E5E7EB', fontSize: 14, boxSizing: 'border-box', outline: 'none' };
const labelStyle: React.CSSProperties = { display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 };
const btnPrimary: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#2563EB', color: '#FFFFFF', borderRadius: 10, border: 'none', fontSize: 14, fontWeight: 500, cursor: 'pointer' };
const sectionTitle: React.CSSProperties = { fontSize: 14, fontWeight: 600, color: '#111827', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 };

export function AdminSettings() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ name: '', inn: '', address: '', phone: '', logoUrl: '', defaultCurrency: 'UZS', defaultLocale: 'ru' });
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data: companiesData, isLoading } = useQuery({
    queryKey: ['admin-companies'],
    queryFn: async () => {
      const { data } = await api.get('/admin/companies', { params: { limit: 1 } });
      return data;
    },
  });

  const company: Company | null = companiesData?.companies?.[0] || null;

  const saveCompany = useMutation({
    mutationFn: async (formData: typeof form) => {
      const payload = {
        name: formData.name,
        inn: formData.inn || null,
        address: formData.address || null,
        phone: formData.phone || null,
        logoUrl: formData.logoUrl || null,
        defaultCurrency: formData.defaultCurrency,
        defaultLocale: formData.defaultLocale,
      };
      if (editingId) return api.patch(`/admin/companies/${editingId}`, payload);
      return api.post('/admin/companies', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-companies'] });
    },
  });

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    try {
      const token = localStorage.getItem('pos_access_token');
      const res = await fetch(`${API_BASE}/api/uploads/image`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd });
      const data = await res.json();
      if (data.url) setForm({ ...form, logoUrl: data.url });
    } catch { alert('Ошибка загрузки'); }
  };

  if (company && !editingId && form.name === '') {
    setForm({
      name: company.name,
      inn: company.inn || '',
      address: company.address || '',
      phone: company.phone || '',
      logoUrl: company.logoUrl || '',
      defaultCurrency: company.defaultCurrency,
      defaultLocale: company.defaultLocale,
    });
    setEditingId(company.id);
  }

  return (
    <div style={pageStyle}>
      <h1 style={{ fontSize: 24, fontWeight: 700 }}>Настройки</h1>

      {isLoading ? (
        <div style={{ ...cardStyle, padding: 32, textAlign: 'center', color: '#6B7280' }}>Загрузка...</div>
      ) : (
        <>
          <div style={{ ...cardStyle, padding: 20 }}>
            <div style={sectionTitle}><Building2 style={{ width: 18, height: 18, color: '#2563EB' }} /> Компания</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 12 }}>
              <div>
                <label style={labelStyle}>Название *</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={inputStyle} placeholder="ООО 'Мой бизнес'" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>ИНН</label>
                  <input value={form.inn} onChange={(e) => setForm({ ...form, inn: e.target.value })} style={inputStyle} placeholder="123456789" />
                </div>
                <div>
                  <label style={labelStyle}>Телефон</label>
                  <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} style={inputStyle} placeholder="+998901234567" />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Адрес</label>
                <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} style={inputStyle} placeholder="г. Ташкент, ул. Примерная, 1" />
              </div>
              <div>
                <label style={labelStyle}>Логотип</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <label style={{ ...btnPrimary, background: '#F3F4F6', color: '#374151', cursor: 'pointer' }}>
                    <Upload style={{ width: 16, height: 16 }} /> Загрузить
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleLogoUpload} />
                  </label>
                  {form.logoUrl && <img src={`${API_BASE}${form.logoUrl}`} alt="Logo" style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover', border: '1px solid #E5E7EB' }} />}
                </div>
              </div>
            </div>
          </div>

          <div style={{ ...cardStyle, padding: 20 }}>
            <div style={sectionTitle}><Globe style={{ width: 18, height: 18, color: '#2563EB' }} /> Региональные настройки</div>
            <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Валюта</label>
                <select value={form.defaultCurrency} onChange={(e) => setForm({ ...form, defaultCurrency: e.target.value })} style={{ ...inputStyle, background: '#FFFFFF' }}>
                  <option value="UZS">UZS — Узбекский сум</option>
                  <option value="USD">USD — Доллар США</option>
                  <option value="RUB">RUB — Российский рубль</option>
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Язык</label>
                <select value={form.defaultLocale} onChange={(e) => setForm({ ...form, defaultLocale: e.target.value })} style={{ ...inputStyle, background: '#FFFFFF' }}>
                  <option value="ru">Русский</option>
                  <option value="en">English</option>
                  <option value="uz">O'zbek</option>
                </select>
              </div>
            </div>
          </div>

          {company?.branches && company.branches.length > 0 && (
            <div style={{ ...cardStyle, padding: 20 }}>
              <div style={sectionTitle}>🏪 Филиалы ({company.branches.length})</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
                {company.branches.map((b) => (
                  <div key={b.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: '#F9FAFB', borderRadius: 10 }}>
                    <span style={{ fontWeight: 500 }}>{b.name}</span>
                    <span style={{ fontSize: 12, padding: '4px 10px', borderRadius: 20, fontWeight: 500, background: b.isActive ? '#DCFCE7' : '#F3F4F6', color: b.isActive ? '#16A34A' : '#6B7280' }}>
                      {b.isActive ? 'Активен' : 'Неактивен'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <PinManagement />

          <ClearAllData />

          <button onClick={() => saveCompany.mutate(form)} disabled={!form.name || saveCompany.isPending}
            style={{ ...btnPrimary, width: '100%', height: 44, justifyContent: 'center' }}>
            <Save style={{ width: 16, height: 16 }} />
            {saveCompany.isPending ? 'Сохранение...' : 'Сохранить настройки'}
          </button>
        </>
      )}
    </div>
  );
}

interface UserPin {
  id: string; fullName: string; username: string; role: string; hasPinCode: boolean;
}

function PinManagement() {
  const queryClient = useQueryClient();
  const [selectedUserId, setSelectedUserId] = useState('');
  const [newPin, setNewPin] = useState('');
  const [success, setSuccess] = useState('');

  const { data: users = [] } = useQuery({
    queryKey: ['users-for-pin'],
    queryFn: async () => {
      const { data } = await api.get('/auth/users-for-pin');
      return data as UserPin[];
    },
  });

  const setPin = useMutation({
    mutationFn: async ({ userId, pin }: { userId: string; pin: string }) => {
      return api.post('/auth/set-pin', { userId, pin });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users-for-pin'] });
      setSuccess('PIN установлен');
      setNewPin('');
      setTimeout(() => setSuccess(''), 2000);
    },
  });

  return (
    <div style={{ background: '#FFFFFF', borderRadius: 16, border: '1px solid #E5E7EB', overflow: 'hidden', padding: 20 }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: '#111827', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <Lock style={{ width: 18, height: 18, color: '#2563EB' }} /> PIN-коды для блокировки кассы
      </div>
      <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 16 }}>
        Установите PIN-код каждому кассиру. После закрытия кассы экран блокируется, для разблокировки нужен PIN.
      </p>

      {success && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: '#F0FDF4', borderRadius: 10, marginBottom: 12, border: '1px solid #BBF7D0' }}>
          <Check style={{ width: 16, height: 16, color: '#16A34A' }} />
          <span style={{ fontSize: 13, fontWeight: 500, color: '#166534' }}>{success}</span>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {users.map((u) => (
          <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: '#F9FAFB', borderRadius: 10, border: '1px solid #E5E7EB' }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 500, fontSize: 14 }}>{u.fullName}</p>
              <p style={{ fontSize: 12, color: '#6B7280' }}>{u.role}</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {u.hasPinCode && (
                <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, background: '#DCFCE7', color: '#16A34A', fontWeight: 500 }}>
                  PIN установлен
                </span>
              )}
              <input
                type="password"
                value={selectedUserId === u.id ? newPin : ''}
                onFocus={() => { setSelectedUserId(u.id); setNewPin(''); }}
                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder={u.hasPinCode ? 'Изменить' : 'Установить'}
                maxLength={10}
                style={{
                  width: 120, height: 36, padding: '0 10px', borderRadius: 8,
                  border: '1px solid #E5E7EB', fontSize: 13, textAlign: 'center', outline: 'none',
                  letterSpacing: 2, fontWeight: 600,
                }}
              />
              <button
                onClick={() => {
                  if (selectedUserId === u.id && newPin.length >= 4) {
                    setPin.mutate({ userId: u.id, pin: newPin });
                  }
                }}
                disabled={selectedUserId !== u.id || newPin.length < 4 || setPin.isPending}
                style={{
                  height: 36, padding: '0 12px', borderRadius: 8, border: 'none',
                  background: selectedUserId === u.id && newPin.length >= 4 ? '#2563EB' : '#E5E7EB',
                  color: selectedUserId === u.id && newPin.length >= 4 ? '#FFFFFF' : '#9CA3AF',
                  fontSize: 13, fontWeight: 500, cursor: selectedUserId === u.id && newPin.length >= 4 ? 'pointer' : 'default',
                }}
              >
                <KeyRound style={{ width: 14, height: 14 }} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ClearAllData() {
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [success, setSuccess] = useState(false);

  const clearAll = useMutation({
    mutationFn: async () => api.post('/admin/reports/clear-all'),
    onSuccess: () => {
      setSuccess(true);
      setShowConfirm(false);
      setConfirmText('');
      setTimeout(() => setSuccess(false), 3000);
    },
  });

  return (
    <div style={{ background: '#FFFFFF', borderRadius: 16, border: '2px solid #FECACA', overflow: 'hidden', padding: 20 }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: '#DC2626', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <AlertTriangle style={{ width: 18, height: 18 }} /> Опасная зона
      </div>
      <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 16 }}>
        Удалить <b>ВСЕ</b> данные: заказы, оплаты, аудит, истории — без восстановления.
      </p>

      {success && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: '#F0FDF4', borderRadius: 10, marginBottom: 12, border: '1px solid #BBF7D0' }}>
          <Check style={{ width: 16, height: 16, color: '#16A34A' }} />
          <span style={{ fontSize: 13, fontWeight: 500, color: '#166534' }}>Все данные очищены</span>
        </div>
      )}

      {!showConfirm ? (
        <button onClick={() => setShowConfirm(true)} style={{
          display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 20px',
          background: '#FEE2E2', color: '#DC2626', borderRadius: 10, border: '1px solid #FECACA',
          fontSize: 14, fontWeight: 500, cursor: 'pointer',
        }}>
          <Trash2 style={{ width: 16, height: 16 }} /> Очистить все данные
        </button>
      ) : (
        <div style={{ background: '#FEF2F2', borderRadius: 10, padding: 16, border: '1px solid #FECACA' }}>
          <p style={{ fontSize: 13, color: '#991B1B', marginBottom: 12, fontWeight: 500 }}>
            Введите <b>УДАЛИТЬ</b> для подтверждения:
          </p>
          <input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="УДАЛИТЬ"
            style={{
              width: '100%', height: 40, padding: '0 12px', borderRadius: 8,
              border: '2px solid #FECACA', fontSize: 14, fontWeight: 600, outline: 'none', boxSizing: 'border-box',
            }}
          />
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button onClick={() => { setShowConfirm(false); setConfirmText(''); }} style={{
              flex: 1, height: 38, borderRadius: 8, border: 'none', background: '#F3F4F6',
              color: '#6B7280', fontSize: 13, fontWeight: 500, cursor: 'pointer',
            }}>Отмена</button>
            <button
              onClick={() => clearAll.mutate()}
              disabled={confirmText !== 'УДАЛИТЬ' || clearAll.isPending}
              style={{
                flex: 1, height: 38, borderRadius: 8, border: 'none',
                background: confirmText === 'УДАЛИТЬ' ? '#DC2626' : '#E5E7EB',
                color: confirmText === 'УДАЛИТЬ' ? '#FFFFFF' : '#9CA3AF',
                fontSize: 13, fontWeight: 600, cursor: confirmText === 'УДАЛИТЬ' ? 'pointer' : 'default',
              }}
            >
              {clearAll.isPending ? 'Удаление...' : 'Удалить всё'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
