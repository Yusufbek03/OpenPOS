import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Plus, Search, Edit2, Trash2, X, Upload } from 'lucide-react';
import { API_BASE } from '@/lib/api-config';
import { ImageCropper } from '@/components/ui/image-cropper';

interface Product {
  id: string; name: string; nameRu: string; nameEn: string; nameUz: string;
  sku: string; barcode: string | null; price: string; cost: string;
  isActive: boolean; categoryId: string; imageUrl: string | null; kitchenStationId: string | null;
  category?: { id: string; name: string; nameRu: string; color: string | null };
}

interface Category {
  id: string; name: string; nameRu: string; icon: string | null; color: string | null; sortOrder: number;
}

interface Station {
  id: string; name: string; sortOrder: number; isActive: boolean;
}

const pageStyle: React.CSSProperties = { padding: 24, display: 'flex', flexDirection: 'column', gap: 20 };
const cardStyle: React.CSSProperties = { background: '#FFFFFF', borderRadius: 16, border: '1px solid #E5E7EB', overflow: 'hidden' };
const inputStyle: React.CSSProperties = { width: '100%', height: 40, padding: '0 12px', borderRadius: 10, border: '1px solid #E5E7EB', fontSize: 14, boxSizing: 'border-box', outline: 'none' };
const labelStyle: React.CSSProperties = { display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 };
const btnPrimary: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#2563EB', color: '#FFFFFF', borderRadius: 10, border: 'none', fontSize: 14, fontWeight: 500, cursor: 'pointer' };
const thStyle: React.CSSProperties = { padding: '12px 12px', textAlign: 'left', fontSize: 13, color: '#6B7280', borderBottom: '1px solid #E5E7EB', fontWeight: 500 };
const tdStyle: React.CSSProperties = { padding: '12px', fontSize: 14, borderBottom: '1px solid #F3F4F6' };

export function AdminProducts() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState({ nameRu: '', nameEn: '', nameUz: '', sku: '', barcode: '', price: '', cost: '', categoryId: '', imageUrl: '', isActive: true, kitchenStationId: '' });
  const [cropFile, setCropFile] = useState<File | null>(null);

  const { data: productsData, isLoading } = useQuery({
    queryKey: ['admin-products', search],
    queryFn: async () => {
      const { data } = await api.get('/products', { params: { limit: 200, search: search || undefined } });
      return data.products as Product[];
    },
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: async () => {
      const { data } = await api.get('/categories', { params: { limit: 100 } });
      return (data.categories || data) as Category[];
    },
  });

  const { data: stations = [] } = useQuery({
    queryKey: ['admin-stations'],
    queryFn: async () => {
      const { data } = await api.get('/admin/kitchen/stations');
      return (data || []) as Station[];
    },
  });

  const saveProduct = useMutation({
    mutationFn: async (formData: typeof form) => {
      const sku = formData.sku || `PRD-${Date.now().toString(36).toUpperCase()}`;
      const catId = formData.categoryId || categories[0]?.id || '';
      const payload = { ...formData, sku, categoryId: catId, name: formData.nameRu, nameEn: formData.nameEn || formData.nameRu, nameUz: formData.nameUz || formData.nameRu, barcode: formData.barcode || null, price: Number(formData.price), cost: Number(formData.cost || '0'), imageUrl: formData.imageUrl || null, kitchenStationId: formData.kitchenStationId || null };
      if (editingProduct) return api.patch(`/products/${editingProduct.id}`, payload);
      return api.post('/products', payload);
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-products'] }); setShowForm(false); setEditingProduct(null); resetForm(); },
  });

  const deleteProduct = useMutation({
    mutationFn: (id: string) => api.delete(`/products/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-products'] }),
  });

  const resetForm = () => setForm({ nameRu: '', nameEn: '', nameUz: '', sku: '', barcode: '', price: '', cost: '', categoryId: '', imageUrl: '', isActive: true, kitchenStationId: '' });

  const startEdit = (p: Product) => {
    setEditingProduct(p);
    setForm({ nameRu: p.nameRu, nameEn: p.nameEn, nameUz: p.nameUz, sku: p.sku, barcode: p.barcode || '', price: p.price, cost: p.cost, categoryId: p.categoryId, imageUrl: p.imageUrl || '', isActive: p.isActive, kitchenStationId: p.kitchenStationId || '' });
    setShowForm(true);
  };

  return (
    <div style={pageStyle}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>Товары</h1>
        <button onClick={() => { resetForm(); setEditingProduct(null); setShowForm(true); }} style={btnPrimary}>
          <Plus style={{ width: 16, height: 16 }} /> Добавить товар
        </button>
      </div>

      <div style={{ position: 'relative', maxWidth: 384 }}>
        <Search style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: '#9CA3AF', pointerEvents: 'none' }} />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Поиск товаров..." style={{ ...inputStyle, paddingLeft: 36 }} />
      </div>

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)' }}>
          <div style={{ background: '#FFFFFF', borderRadius: 16, width: '100%', maxWidth: 480, margin: '0 16px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', maxHeight: '90vh', overflow: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #E5E7EB' }}>
              <h2 style={{ fontSize: 16, fontWeight: 600 }}>{editingProduct ? 'Редактировать товар' : 'Новый товар'}</h2>
              <button onClick={() => { setShowForm(false); setEditingProduct(null); }} style={{ padding: 4, background: 'none', border: 'none', cursor: 'pointer', borderRadius: 6 }}><X style={{ width: 20, height: 20 }} /></button>
            </div>
            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div><label style={labelStyle}>Название (RU) *</label><input value={form.nameRu} onChange={(e) => setForm({ ...form, nameRu: e.target.value })} style={inputStyle} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div><label style={labelStyle}>Название (EN)</label><input value={form.nameEn} onChange={(e) => setForm({ ...form, nameEn: e.target.value })} style={inputStyle} /></div>
                <div><label style={labelStyle}>Название (UZ)</label><input value={form.nameUz} onChange={(e) => setForm({ ...form, nameUz: e.target.value })} style={inputStyle} /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div><label style={labelStyle}>Артикул (SKU) *</label><input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} style={inputStyle} /></div>
                <div><label style={labelStyle}>Штрих-код</label><input value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} style={inputStyle} /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <div><label style={labelStyle}>Цена *</label><input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} style={inputStyle} /></div>
                <div><label style={labelStyle}>Себестоимость</label><input type="number" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} style={inputStyle} /></div>
              </div>
              <div>
                <label style={labelStyle}>Категория</label>
                <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} style={{ ...inputStyle, background: '#FFFFFF' }}>
                  <option value="">Без категории</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.nameRu}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Кухонная станция</label>
                <select value={form.kitchenStationId} onChange={(e) => setForm({ ...form, kitchenStationId: e.target.value })} style={{ ...inputStyle, background: '#FFFFFF' }}>
                  <option value="">Без станции</option>
                  {stations.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Фото товара</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <label style={{ ...btnPrimary, background: '#F3F4F6', color: '#374151', cursor: 'pointer' }}>
                    <Upload style={{ width: 16, height: 16 }} /> Загрузить
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) setCropFile(file);
                      e.target.value = '';
                    }} />
                  </label>
                  {form.imageUrl && <img src={`${API_BASE}${form.imageUrl}`} alt="Preview" style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover', border: '1px solid #E5E7EB' }} />}
                </div>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
                <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} style={{ width: 16, height: 16, borderRadius: 4 }} />
                Активен
              </label>
              <button onClick={() => saveProduct.mutate(form)} disabled={!form.nameRu || !form.price} style={{ ...btnPrimary, width: '100%', height: 44, justifyContent: 'center', opacity: !form.nameRu || !form.price ? 0.5 : 1 }}>
                {editingProduct ? 'Сохранить' : 'Создать'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={cardStyle}>
        {isLoading ? (
          <div style={{ padding: 32, textAlign: 'center', color: '#6B7280' }}>Загрузка...</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={thStyle}>Товар</th>
                <th style={thStyle}>SKU</th>
                <th style={thStyle}>Категория</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Цена</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>Статус</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Действия</th>
              </tr>
            </thead>
            <tbody>
              {(productsData || []).map((p) => (
                <tr key={p.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {p.imageUrl ? <img src={`${API_BASE}${p.imageUrl}`} alt="" style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'cover' }} /> : <div style={{ width: 36, height: 36, borderRadius: 8, background: '#F3F4F6' }} />}
                      {p.nameRu}
                    </div>
                  </td>
                  <td style={{ ...tdStyle, color: '#6B7280', fontSize: 13 }}>{p.sku}</td>
                  <td style={tdStyle}>{p.category?.nameRu || '—'}</td>
                  <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 500 }}>{Number(p.price).toLocaleString('uz-UZ')} сўм</td>
                  <td style={{ ...tdStyle, textAlign: 'center' }}>
                    <span style={{ fontSize: 12, padding: '4px 10px', borderRadius: 20, fontWeight: 500, background: p.isActive ? '#DCFCE7' : '#F3F4F6', color: p.isActive ? '#16A34A' : '#6B7280' }}>
                      {p.isActive ? 'Активен' : 'Неактивен'}
                    </span>
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}>
                    <button onClick={() => startEdit(p)} style={{ padding: 6, background: 'none', border: 'none', cursor: 'pointer', borderRadius: 6, color: '#6B7280' }}><Edit2 style={{ width: 16, height: 16 }} /></button>
                    <button onClick={() => { if (confirm('Удалить товар?')) deleteProduct.mutate(p.id); }} style={{ padding: 6, background: 'none', border: 'none', cursor: 'pointer', borderRadius: 6, color: '#EF4444' }}><Trash2 style={{ width: 16, height: 16 }} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
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
