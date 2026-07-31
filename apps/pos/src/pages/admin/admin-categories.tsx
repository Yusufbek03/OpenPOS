import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Plus, Edit2, Trash2, X, Upload } from 'lucide-react';
import { API_BASE } from '@/lib/api-config';
import { ImageCropper } from '@/components/ui/image-cropper';

interface Category {
  id: string; name: string; nameRu: string; nameEn: string; nameUz: string;
  icon: string | null; color: string | null; imageUrl: string | null; sortOrder: number; isActive: boolean;
  _count?: { products: number };
}

const pageStyle: React.CSSProperties = { padding: 24, display: 'flex', flexDirection: 'column', gap: 20 };
const inputStyle: React.CSSProperties = { width: '100%', height: 40, padding: '0 12px', borderRadius: 10, border: '1px solid #E5E7EB', fontSize: 14, boxSizing: 'border-box', outline: 'none' };
const labelStyle: React.CSSProperties = { display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 };
const btnPrimary: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#2563EB', color: '#FFFFFF', borderRadius: 10, border: 'none', fontSize: 14, fontWeight: 500, cursor: 'pointer' };

export function AdminCategories() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState({ nameRu: '', nameEn: '', nameUz: '', icon: '', color: '#3B82F6', imageUrl: '', sortOrder: 0, isActive: true });
  const [cropFile, setCropFile] = useState<File | null>(null);

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: async () => {
      const { data } = await api.get('/categories', { params: { limit: 100 } });
      return (data.categories || data) as Category[];
    },
  });

  const saveCategory = useMutation({
    mutationFn: async (f: typeof form) => {
      const payload = { ...f, name: f.nameRu, nameEn: f.nameEn || f.nameRu, nameUz: f.nameUz || f.nameRu, icon: f.icon || null, imageUrl: f.imageUrl || null };
      if (editing) return api.patch(`/categories/${editing.id}`, payload);
      return api.post('/categories', payload);
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-categories'] }); queryClient.invalidateQueries({ queryKey: ['categories'] }); setShowForm(false); setEditing(null); },
  });

  const deleteCategory = useMutation({
    mutationFn: (id: string) => api.delete(`/categories/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-categories'] }); queryClient.invalidateQueries({ queryKey: ['categories'] }); },
  });

  return (
    <div style={pageStyle}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>Категории</h1>
        <button onClick={() => { setEditing(null); setForm({ nameRu: '', nameEn: '', nameUz: '', icon: '', color: '#3B82F6', imageUrl: '', sortOrder: 0, isActive: true }); setShowForm(true); }} style={btnPrimary}>
          <Plus style={{ width: 16, height: 16 }} /> Добавить
        </button>
      </div>

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)' }}>
          <div style={{ background: '#FFFFFF', borderRadius: 16, width: '100%', maxWidth: 440, margin: '0 16px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #E5E7EB' }}>
              <h2 style={{ fontSize: 16, fontWeight: 600 }}>{editing ? 'Редактировать' : 'Новая категория'}</h2>
              <button onClick={() => { setShowForm(false); setEditing(null); }} style={{ padding: 4, background: 'none', border: 'none', cursor: 'pointer', borderRadius: 6 }}><X style={{ width: 20, height: 20 }} /></button>
            </div>
            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div><label style={labelStyle}>Название (RU) *</label><input value={form.nameRu} onChange={(e) => setForm({ ...form, nameRu: e.target.value })} style={inputStyle} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div><label style={labelStyle}>Название (EN)</label><input value={form.nameEn} onChange={(e) => setForm({ ...form, nameEn: e.target.value })} style={inputStyle} /></div>
                <div><label style={labelStyle}>Название (UZ)</label><input value={form.nameUz} onChange={(e) => setForm({ ...form, nameUz: e.target.value })} style={inputStyle} /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div><label style={labelStyle}>Иконка (эмодзи)</label><input value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} placeholder="🍕" style={inputStyle} /></div>
                <div><label style={labelStyle}>Цвет</label><input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} style={{ ...inputStyle, padding: '4px 8px' }} /></div>
              </div>
              <div>
                <label style={labelStyle}>Фото</label>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <label style={{ ...btnPrimary, cursor: 'pointer', flex: 1, justifyContent: 'center', height: 40 }}>
                    <Upload style={{ width: 16, height: 16 }} />
                    Загрузить фото
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) setCropFile(file);
                      e.target.value = '';
                    }} />
                  </label>
                  {form.imageUrl && (
                    <button onClick={() => setForm({ ...form, imageUrl: '' })} style={{ padding: 6, background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444' }}>
                      <Trash2 style={{ width: 16, height: 16 }} />
                    </button>
                  )}
                </div>
                {form.imageUrl && (
                  <div style={{ textAlign: 'center', marginTop: 8 }}>
                    <img src={form.imageUrl} alt="Preview" style={{ maxWidth: 80, maxHeight: 80, borderRadius: 12, objectFit: 'cover', border: '1px solid #E5E7EB' }} />
                  </div>
                )}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div><label style={labelStyle}>Порядок</label><input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })} style={inputStyle} /></div>
                <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 2 }}><label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}><input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} style={{ width: 16, height: 16 }} /> Активна</label></div>
              </div>
              <button onClick={() => saveCategory.mutate(form)} disabled={!form.nameRu} style={{ ...btnPrimary, width: '100%', height: 44, justifyContent: 'center', opacity: !form.nameRu ? 0.5 : 1 }}>
                {editing ? 'Сохранить' : 'Создать'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
        {isLoading ? <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 32, color: '#6B7280' }}>Загрузка...</div> : categories.map((c) => (
          <div key={c.id} style={{ background: '#FFFFFF', borderRadius: 16, border: '1px solid #E5E7EB', padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {c.imageUrl ? (
                  <img src={c.imageUrl} alt={c.nameRu} style={{ width: 40, height: 40, borderRadius: 12, objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: c.color || '#E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                    {c.icon || '📁'}
                  </div>
                )}
                <div>
                  <h3 style={{ fontWeight: 500, fontSize: 15 }}>{c.nameRu}</h3>
                  <p style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>{c._count?.products ?? 0} товаров</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                <button onClick={() => { setEditing(c); setForm({ nameRu: c.nameRu, nameEn: c.nameEn, nameUz: c.nameUz, icon: c.icon || '', color: c.color || '#3B82F6', imageUrl: c.imageUrl || '', sortOrder: c.sortOrder, isActive: c.isActive }); setShowForm(true); }} style={{ padding: 6, background: 'none', border: 'none', cursor: 'pointer', borderRadius: 6 }}><Edit2 style={{ width: 16, height: 16, color: '#6B7280' }} /></button>
                <button onClick={() => { if (confirm('Удалить категорию?')) deleteCategory.mutate(c.id); }} style={{ padding: 6, background: 'none', border: 'none', cursor: 'pointer', borderRadius: 6 }}><Trash2 style={{ width: 16, height: 16, color: '#EF4444' }} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {cropFile && (
        <ImageCropper
          file={cropFile}
          onCancel={() => setCropFile(null)}
          onCropped={async (blob) => {
            setCropFile(null);
            const fd = new FormData();
            fd.append('file', blob, 'image.jpg');
            try {
              const token = localStorage.getItem('pos_access_token');
              const res = await fetch(`${API_BASE}/api/uploads/image`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd });
              const data = await res.json();
              if (data.url) setForm({ ...form, imageUrl: data.url });
            } catch { alert('Ошибка загрузки'); }
          }}
        />
      )}
    </div>
  );
}
