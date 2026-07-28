import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Search, Package, AlertTriangle, ArrowDownCircle, ArrowUpCircle, History } from 'lucide-react';

interface InventoryItem {
  id: string; productId: string; quantity: string; minQuantity: string; maxQuantity: string;
  product?: { id: string; nameRu: string; sku: string; cost: string; imageUrl: string | null; category?: { nameRu: string } };
}

interface HistoryItem {
  id: string; productId: string; type: string; quantity: string; notes: string | null; createdAt: string;
  product?: { nameRu: string; sku: string };
}

const pageStyle: React.CSSProperties = { padding: 24, display: 'flex', flexDirection: 'column', gap: 20 };
const cardStyle: React.CSSProperties = { background: '#FFFFFF', borderRadius: 16, border: '1px solid #E5E7EB', overflow: 'hidden' };
const inputStyle: React.CSSProperties = { width: '100%', height: 40, padding: '0 12px', borderRadius: 10, border: '1px solid #E5E7EB', fontSize: 14, boxSizing: 'border-box', outline: 'none' };
const labelStyle: React.CSSProperties = { display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 };
const btnPrimary: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#2563EB', color: '#FFFFFF', borderRadius: 10, border: 'none', fontSize: 14, fontWeight: 500, cursor: 'pointer' };
const thStyle: React.CSSProperties = { padding: '12px 12px', textAlign: 'left', fontSize: 13, color: '#6B7280', borderBottom: '1px solid #E5E7EB', fontWeight: 500 };
const tdStyle: React.CSSProperties = { padding: '12px', fontSize: 14, borderBottom: '1px solid #F3F4F6' };

type Tab = 'stock' | 'receive' | 'writeoff' | 'history';

export function AdminInventory() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>('stock');
  const [search, setSearch] = useState('');
  const [showLowStock, setShowLowStock] = useState(false);
  const [receiveForm, setReceiveForm] = useState({ productId: '', quantity: '', notes: '' });
  const [writeoffForm, setWriteoffForm] = useState({ productId: '', quantity: '', reason: 'Списание', notes: '' });

  const { data: inventoryData, isLoading } = useQuery({
    queryKey: ['admin-inventory', search, showLowStock],
    queryFn: async () => {
      const { data } = await api.get('/inventory', { params: { limit: 200, lowStock: showLowStock || undefined } });
      return data;
    },
  });

  const { data: historyData } = useQuery({
    queryKey: ['admin-inventory-history'],
    queryFn: async () => {
      const { data } = await api.get('/inventory/history', { params: { limit: 100 } });
      return data;
    },
    enabled: tab === 'history',
  });

  const { data: productsData } = useQuery({
    queryKey: ['admin-products-for-inventory'],
    queryFn: async () => {
      const { data } = await api.get('/products', { params: { limit: 500 } });
      return data.products || [];
    },
  });

  const receiveMutation = useMutation({
    mutationFn: async (formData: typeof receiveForm) => {
      return api.post('/inventory/receive', {
        productId: formData.productId,
        quantity: Number(formData.quantity),
        notes: formData.notes || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-inventory'] });
      queryClient.invalidateQueries({ queryKey: ['admin-inventory-history'] });
      setReceiveForm({ productId: '', quantity: '', notes: '' });
    },
  });

  const writeoffMutation = useMutation({
    mutationFn: async (formData: typeof writeoffForm) => {
      return api.post('/inventory/writeoff', {
        productId: formData.productId,
        quantity: Number(formData.quantity),
        reason: formData.reason,
        notes: formData.notes || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-inventory'] });
      queryClient.invalidateQueries({ queryKey: ['admin-inventory-history'] });
      setWriteoffForm({ productId: '', quantity: '', reason: 'Списание', notes: '' });
    },
  });

  const items: InventoryItem[] = inventoryData?.inventory || inventoryData?.items || [];
  const products = productsData || [];
  const historyItems: HistoryItem[] = historyData?.items || historyData?.history || [];

  const filteredItems = items.filter((item: InventoryItem) => {
    if (!search) return true;
    const name = item.product?.nameRu || '';
    const sku = item.product?.sku || '';
    return name.toLowerCase().includes(search.toLowerCase()) || sku.toLowerCase().includes(search.toLowerCase());
  });

  const lowStockCount = items.filter((item: InventoryItem) => Number(item.quantity) <= Number(item.minQuantity)).length;

  const TYPE_LABELS: Record<string, { label: string; color: string }> = {
    RECEIPT: { label: 'Приход', color: '#16A34A' },
    WRITE_OFF: { label: 'Списание', color: '#EF4444' },
    SALE: { label: 'Продажа', color: '#2563EB' },
    TRANSFER: { label: 'Перемещение', color: '#F59E0B' },
    INVENTORY: { label: 'Инвентаризация', color: '#8B5CF6' },
    RETURN: { label: 'Возврат', color: '#0891B2' },
  };

  return (
    <div style={pageStyle}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>Склад</h1>
        {lowStockCount > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: '#FEF3C7', borderRadius: 10, fontSize: 13, fontWeight: 500, color: '#B45309' }}>
            <AlertTriangle style={{ width: 16, height: 16 }} /> {lowStockCount} товар(ов) ниже минимума
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 4, background: '#F3F4F6', padding: 4, borderRadius: 12 }}>
        {([
          { id: 'stock' as Tab, label: 'Остатки', icon: Package },
          { id: 'receive' as Tab, label: 'Приход', icon: ArrowDownCircle },
          { id: 'writeoff' as Tab, label: 'Списание', icon: ArrowUpCircle },
          { id: 'history' as Tab, label: 'История', icon: History },
        ]).map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px 0', borderRadius: 10, border: 'none', fontSize: 14, fontWeight: 500, cursor: 'pointer', background: tab === t.id ? '#FFFFFF' : 'transparent', color: tab === t.id ? '#2563EB' : '#6B7280', boxShadow: tab === t.id ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>
            <t.icon style={{ width: 16, height: 16 }} /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'stock' && (
        <>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1, maxWidth: 384 }}>
              <Search style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: '#9CA3AF', pointerEvents: 'none' }} />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Поиск товаров..." style={{ ...inputStyle, paddingLeft: 36 }} />
            </div>
            <button onClick={() => setShowLowStock(!showLowStock)} style={{ padding: '8px 16px', borderRadius: 10, border: '1px solid #E5E7EB', background: showLowStock ? '#FEF3C7' : '#FFFFFF', color: showLowStock ? '#B45309' : '#374151', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
              <AlertTriangle style={{ width: 14, height: 14, display: 'inline', marginRight: 4 }} /> Только мало
            </button>
          </div>
          <div style={cardStyle}>
            {isLoading ? (
              <div style={{ padding: 32, textAlign: 'center', color: '#6B7280' }}>Загрузка...</div>
            ) : filteredItems.length === 0 ? (
              <div style={{ padding: 32, textAlign: 'center', color: '#6B7280' }}>Нет данных об остатках</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={thStyle}>Товар</th>
                    <th style={thStyle}>SKU</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>Остаток</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>Минимум</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>Себестоимость</th>
                    <th style={{ ...thStyle, textAlign: 'center' }}>Статус</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item: InventoryItem) => {
                    const qty = Number(item.quantity);
                    const min = Number(item.minQuantity);
                    const isLow = qty <= min;
                    return (
                      <tr key={item.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                        <td style={tdStyle}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            {item.product?.imageUrl ? (
                              <img src={item.product.imageUrl} alt="" style={{ width: 32, height: 32, borderRadius: 6, objectFit: 'cover' }} />
                            ) : (
                              <div style={{ width: 32, height: 32, borderRadius: 6, background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>📦</div>
                            )}
                            <div>
                              <div style={{ fontWeight: 500 }}>{item.product?.nameRu || '—'}</div>
                              <div style={{ fontSize: 12, color: '#9CA3AF' }}>{item.product?.category?.nameRu || ''}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ ...tdStyle, color: '#6B7280', fontSize: 13, fontFamily: 'monospace' }}>{item.product?.sku || '—'}</td>
                        <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600, color: isLow ? '#EF4444' : '#111827' }}>{qty}</td>
                        <td style={{ ...tdStyle, textAlign: 'right', color: '#6B7280' }}>{min}</td>
                        <td style={{ ...tdStyle, textAlign: 'right' }}>{Number(item.product?.cost || 0).toLocaleString('uz-UZ')} сўм</td>
                        <td style={{ ...tdStyle, textAlign: 'center' }}>
                          <span style={{ fontSize: 12, padding: '4px 10px', borderRadius: 20, fontWeight: 500, background: isLow ? '#FEE2E2' : '#DCFCE7', color: isLow ? '#EF4444' : '#16A34A' }}>
                            {isLow ? 'Мало' : 'Норма'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {tab === 'receive' && (
        <div style={{ ...cardStyle, padding: 20, maxWidth: 480 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>📦 Приход товара</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={labelStyle}>Товар *</label>
              <select value={receiveForm.productId} onChange={(e) => setReceiveForm({ ...receiveForm, productId: e.target.value })} style={{ ...inputStyle, background: '#FFFFFF' }}>
                <option value="">Выберите товар</option>
                {products.map((p: { id: string; nameRu: string; sku: string }) => <option key={p.id} value={p.id}>{p.nameRu} ({p.sku})</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Количество *</label>
              <input type="number" value={receiveForm.quantity} onChange={(e) => setReceiveForm({ ...receiveForm, quantity: e.target.value })} style={inputStyle} min="0.01" step="0.01" />
            </div>
            <div>
              <label style={labelStyle}>Примечание</label>
              <input value={receiveForm.notes} onChange={(e) => setReceiveForm({ ...receiveForm, notes: e.target.value })} style={inputStyle} placeholder="Например: Поставка от ООО 'Поставщик'" />
            </div>
            <button onClick={() => receiveMutation.mutate(receiveForm)} disabled={!receiveForm.productId || !receiveForm.quantity || receiveMutation.isPending} style={{ ...btnPrimary, width: '100%', height: 44, justifyContent: 'center', opacity: !receiveForm.productId || !receiveForm.quantity ? 0.5 : 1 }}>
              {receiveMutation.isPending ? 'Обработка...' : '✅ Принять товар'}
            </button>
          </div>
        </div>
      )}

      {tab === 'writeoff' && (
        <div style={{ ...cardStyle, padding: 20, maxWidth: 480 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>📝 Списание товара</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={labelStyle}>Товар *</label>
              <select value={writeoffForm.productId} onChange={(e) => setWriteoffForm({ ...writeoffForm, productId: e.target.value })} style={{ ...inputStyle, background: '#FFFFFF' }}>
                <option value="">Выберите товар</option>
                {products.map((p: { id: string; nameRu: string; sku: string }) => <option key={p.id} value={p.id}>{p.nameRu} ({p.sku})</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Количество *</label>
              <input type="number" value={writeoffForm.quantity} onChange={(e) => setWriteoffForm({ ...writeoffForm, quantity: e.target.value })} style={inputStyle} min="0.01" step="0.01" />
            </div>
            <div>
              <label style={labelStyle}>Причина *</label>
              <select value={writeoffForm.reason} onChange={(e) => setWriteoffForm({ ...writeoffForm, reason: e.target.value })} style={{ ...inputStyle, background: '#FFFFFF' }}>
                <option value="Порча">Порча</option>
                <option value="Просрочка">Просрочка</option>
                <option value="Потеря">Потеря</option>
                <option value="Внутреннее использование">Внутреннее использование</option>
                <option value="Производство">Производство</option>
                <option value="Списание">Другое</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Примечание</label>
              <input value={writeoffForm.notes} onChange={(e) => setWriteoffForm({ ...writeoffForm, notes: e.target.value })} style={inputStyle} />
            </div>
            <button onClick={() => writeoffMutation.mutate(writeoffForm)} disabled={!writeoffForm.productId || !writeoffForm.quantity || writeoffMutation.isPending}
              style={{ ...btnPrimary, width: '100%', height: 44, justifyContent: 'center', background: '#EF4444', opacity: !writeoffForm.productId || !writeoffForm.quantity ? 0.5 : 1 }}>
              {writeoffMutation.isPending ? 'Обработка...' : '📝 Списать'}
            </button>
          </div>
        </div>
      )}

      {tab === 'history' && (
        <div style={cardStyle}>
          {historyItems.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', color: '#6B7280' }}>Нет записей</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={thStyle}>Дата</th>
                  <th style={thStyle}>Тип</th>
                  <th style={thStyle}>Товар</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Количество</th>
                  <th style={thStyle}>Примечание</th>
                </tr>
              </thead>
              <tbody>
                {historyItems.map((h: HistoryItem) => {
                  const typeInfo = TYPE_LABELS[h.type] || { label: h.type, color: '#6B7280' };
                  return (
                    <tr key={h.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                      <td style={{ ...tdStyle, fontSize: 13, color: '#6B7280' }}>{new Date(h.createdAt).toLocaleString('ru-RU')}</td>
                      <td style={tdStyle}>
                        <span style={{ fontSize: 12, padding: '4px 10px', borderRadius: 20, fontWeight: 500, background: `${typeInfo.color}15`, color: typeInfo.color }}>{typeInfo.label}</span>
                      </td>
                      <td style={tdStyle}>{h.product?.nameRu || '—'}</td>
                      <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600, color: h.type === 'WRITE_OFF' || h.type === 'SALE' ? '#EF4444' : '#16A34A' }}>
                        {h.type === 'WRITE_OFF' || h.type === 'SALE' ? '-' : '+'}{h.quantity}
                      </td>
                      <td style={{ ...tdStyle, fontSize: 13, color: '#6B7280' }}>{h.notes || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
