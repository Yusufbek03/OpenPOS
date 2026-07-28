import { useCartStore } from '@/stores/cart-store';
import { useRemovedItemsStore } from '@/stores/removed-items-store';
import { Minus, Plus, Trash2, StickyNote, Tag, User, Hash } from 'lucide-react';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';
import { PinVerifyModal } from './pin-verify-modal';

interface CartProps {
  onCheckout: () => void;
}

export function Cart({ onCheckout }: CartProps) {
  const items = useCartStore((s) => s.items);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const clearCart = useCartStore((s) => s.clearCart);
  const getSubtotal = useCartStore((s) => s.getSubtotal);
  const getTotal = useCartStore((s) => s.getTotal);
  const getItemCount = useCartStore((s) => s.getItemCount);
  const orderDiscount = useCartStore((s) => s.orderDiscount);
  const orderDiscountType = useCartStore((s) => s.orderDiscountType);
  const setOrderDiscount = useCartStore((s) => s.setOrderDiscount);
  const getOrderDiscountAmount = useCartStore((s) => s.getOrderDiscountAmount);
  const getItemDiscounts = useCartStore((s) => s.getItemDiscounts);
  const customer = useCartStore((s) => s.customer);
  const setCustomer = useCartStore((s) => s.setCustomer);
  const tableId = useCartStore((s) => s.tableId);
  const setTableId = useCartStore((s) => s.setTableId);
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');
  const updateItemNote = useCartStore((s) => s.updateItemNote);
  const [showDiscount, setShowDiscount] = useState(false);
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [showTablePicker, setShowTablePicker] = useState(false);
  const [showPinVerify, setShowPinVerify] = useState(false);
  const [pendingRemove, setPendingRemove] = useState<{ productId: string; item: typeof items[0] } | null>(null);
  const user = useAuthStore((s) => s.user);
  const addRemovedItem = useRemovedItemsStore((s) => s.addItem);

  const { data: customersData } = useQuery({
    queryKey: ['pos-customers', customerSearch],
    queryFn: async () => {
      const { data } = await api.get('/customers', { params: { limit: 10, search: customerSearch || undefined } });
      return data.customers || [];
    },
    enabled: showCustomerSearch,
  });

  const { data: tablesData = [] } = useQuery({
    queryKey: ['pos-tables'],
    queryFn: async () => {
      const { data } = await api.get('/tables', { params: { status: 'FREE' } });
      return data as { id: string; name: string; number: number; zone: string | null }[];
    },
    enabled: showTablePicker,
  });

  const handleRemoveClick = (item: typeof items[0]) => {
    setPendingRemove({ productId: item.productId, item });
    setShowPinVerify(true);
  };

  const handlePinVerified = () => {
    if (pendingRemove) {
      addRemovedItem(pendingRemove.item, user?.id || '', user?.fullName || 'Кассир');
      removeItem(pendingRemove.productId);
      setPendingRemove(null);
    }
    setShowPinVerify(false);
  };

  const saveNote = (productId: string) => {
    updateItemNote(productId, noteText);
    setEditingNote(null);
  };

  const discountAmount = getOrderDiscountAmount();
  const itemDiscounts = getItemDiscounts();

  return (
    <div style={{ width: 340, background: '#FFFFFF', borderLeft: '1px solid #E5E7EB', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
      <PinVerifyModal
        open={showPinVerify}
        onClose={() => { setShowPinVerify(false); setPendingRemove(null); }}
        onVerified={handlePinVerified}
        title="Подтвердите удаление товара"
      />
      <div style={{ padding: '14px 16px', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontWeight: 600, fontSize: 15 }}>Корзина</h2>
          <p style={{ fontSize: 12, color: '#6B7280' }}>{getItemCount()} товаров</p>
        </div>
        {items.length > 0 && (
          <button onClick={clearCart} style={{ fontSize: 12, color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
            Очистить
          </button>
        )}
      </div>

      <div style={{ padding: '8px 12px', borderBottom: '1px solid #E5E7EB', display: 'flex', gap: 6 }}>
        <button onClick={() => setShowCustomerSearch(!showCustomerSearch)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, padding: '6px 0', borderRadius: 8, border: '1px solid #E5E7EB', background: customer ? '#EFF6FF' : '#FFFFFF', color: customer ? '#2563EB' : '#6B7280', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>
          <User style={{ width: 14, height: 14 }} /> {customer ? customer.fullName : 'Клиент'}
        </button>
        <button onClick={() => setShowTablePicker(!showTablePicker)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, padding: '6px 0', borderRadius: 8, border: '1px solid #E5E7EB', background: tableId ? '#EFF6FF' : '#FFFFFF', color: tableId ? '#2563EB' : '#6B7280', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>
          <Hash style={{ width: 14, height: 14 }} /> {tableId ? `Стол ${tablesData.find(t => t.id === tableId)?.number || ''}` : 'Стол'}
        </button>
        <button onClick={() => setShowDiscount(!showDiscount)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, padding: '6px 0', borderRadius: 8, border: '1px solid #E5E7EB', background: orderDiscount > 0 ? '#FEF3C7' : '#FFFFFF', color: orderDiscount > 0 ? '#B45309' : '#6B7280', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>
          <Tag style={{ width: 14, height: 14 }} /> Скидка
        </button>
      </div>

      {showCustomerSearch && (
        <div style={{ padding: '8px 12px', borderBottom: '1px solid #E5E7EB' }}>
          <input value={customerSearch} onChange={(e) => setCustomerSearch(e.target.value)} placeholder="Поиск клиента..." autoFocus style={{ width: '100%', height: 32, padding: '0 10px', fontSize: 13, borderRadius: 8, border: '1px solid #E5E7EB', outline: 'none', boxSizing: 'border-box' }} />
          <div style={{ maxHeight: 120, overflowY: 'auto', marginTop: 4 }}>
            <button onClick={() => { setCustomer(null); setShowCustomerSearch(false); setCustomerSearch(''); }} style={{ width: '100%', padding: '6px 8px', fontSize: 12, textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', borderRadius: 6, color: '#6B7280' }}>Без клиента</button>
            {(customersData || []).map((c: { id: string; fullName: string; phone: string | null; bonusBalance: string }) => (
              <button key={c.id} onClick={() => { setCustomer(c); setShowCustomerSearch(false); setCustomerSearch(''); }} style={{ width: '100%', padding: '6px 8px', fontSize: 12, textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', borderRadius: 6 }}>
                <div style={{ fontWeight: 500 }}>{c.fullName}</div>
                <div style={{ fontSize: 11, color: '#9CA3AF' }}>{c.phone || '—'} · Бонусы: {Number(c.bonusBalance).toLocaleString('uz-UZ')}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {showTablePicker && (
        <div style={{ padding: '8px 12px', borderBottom: '1px solid #E5E7EB' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 4, maxHeight: 120, overflowY: 'auto' }}>
            {tablesData.map((t) => (
              <button key={t.id} onClick={() => { setTableId(tableId === t.id ? null : t.id); setShowTablePicker(false); }}
                style={{ padding: '6px 0', borderRadius: 8, border: '1px solid #E5E7EB', background: tableId === t.id ? '#2563EB' : '#FFFFFF', color: tableId === t.id ? '#FFFFFF' : '#374151', fontSize: 11, fontWeight: 500, cursor: 'pointer', textAlign: 'center' }}>
                #{t.number}
              </button>
            ))}
            {tablesData.length === 0 && <p style={{ gridColumn: '1 / -1', fontSize: 12, color: '#9CA3AF', textAlign: 'center', padding: 8 }}>Нет свободных столов</p>}
          </div>
        </div>
      )}

      {showDiscount && (
        <div style={{ padding: '8px 12px', borderBottom: '1px solid #E5E7EB', display: 'flex', gap: 6, alignItems: 'center' }}>
          <select value={orderDiscountType} onChange={(e) => setOrderDiscount(orderDiscount, e.target.value as 'fixed' | 'percent')} style={{ height: 32, padding: '0 8px', fontSize: 13, borderRadius: 8, border: '1px solid #E5E7EB', background: '#FFFFFF', outline: 'none' }}>
            <option value="fixed">сўм</option>
            <option value="percent">%</option>
          </select>
          <input type="number" value={orderDiscount || ''} onChange={(e) => setOrderDiscount(Number(e.target.value), orderDiscountType)} placeholder="0" style={{ flex: 1, height: 32, padding: '0 8px', fontSize: 13, borderRadius: 8, border: '1px solid #E5E7EB', outline: 'none' }} />
          <button onClick={() => { setOrderDiscount(0, 'fixed'); setShowDiscount(false); }} style={{ padding: '0 8px', height: 32, fontSize: 12, background: '#F3F4F6', color: '#6B7280', border: 'none', borderRadius: 8, cursor: 'pointer' }}>✕</button>
        </div>
      )}

      <div style={{ flex: 1, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {items.length === 0 ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#6B7280' }}>
            <span style={{ fontSize: 40, marginBottom: 8 }}>🛒</span>
            <p style={{ fontSize: 13 }}>Корзина пуста</p>
            <p style={{ fontSize: 12, marginTop: 4, color: '#9CA3AF' }}>Выберите товар из каталога</p>
          </div>
        ) : (
          items.map((item) => (
            <div key={item.productId} style={{ background: '#F9FAFB', borderRadius: 12, padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.product.nameRu}</p>
                  <p style={{ fontSize: 12, color: '#6B7280' }}>{Number(item.unitPrice).toLocaleString('uz-UZ')} сўм × {item.quantity}</p>
                  {item.note && <p style={{ fontSize: 11, color: '#2563EB', marginTop: 2 }}>📝 {item.note}</p>}
                </div>
                <p style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}>
                  {Number(item.total).toLocaleString('uz-UZ')} сўм
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <button onClick={() => updateQuantity(item.productId, item.quantity - 1)} style={{ width: 28, height: 28, borderRadius: 8, background: '#FFFFFF', border: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                    <Minus style={{ width: 12, height: 12 }} />
                  </button>
                  <span style={{ width: 32, textAlign: 'center', fontSize: 13, fontWeight: 500 }}>{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.productId, item.quantity + 1)} style={{ width: 28, height: 28, borderRadius: 8, background: '#FFFFFF', border: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                    <Plus style={{ width: 12, height: 12 }} />
                  </button>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <button onClick={() => { setEditingNote(item.productId); setNoteText(item.note); }} style={{ padding: 6, borderRadius: 8, background: 'none', border: 'none', cursor: 'pointer', color: item.note ? '#2563EB' : '#6B7280' }}>
                    <StickyNote style={{ width: 14, height: 14 }} />
                  </button>
                  <button onClick={() => handleRemoveClick(item)} style={{ padding: 6, borderRadius: 8, background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444' }}>
                    <Trash2 style={{ width: 14, height: 14 }} />
                  </button>
                </div>
              </div>

              {editingNote === item.productId && (
                <div style={{ display: 'flex', gap: 4 }}>
                  <input
                    type="text"
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="Без лука, очень остро..."
                    style={{ flex: 1, height: 28, padding: '0 8px', fontSize: 12, borderRadius: 6, border: '1px solid #E5E7EB', outline: 'none' }}
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && saveNote(item.productId)}
                  />
                  <button onClick={() => saveNote(item.productId)} style={{ padding: '0 8px', height: 28, fontSize: 12, background: '#2563EB', color: '#FFFFFF', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
                    OK
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <div style={{ padding: 16, borderTop: '1px solid #E5E7EB', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
            <span style={{ color: '#6B7280' }}>Подытог</span>
            <span>{getSubtotal().toLocaleString('uz-UZ')} сўм</span>
          </div>
          {itemDiscounts > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: '#6B7280' }}>Скидки на товары</span>
              <span style={{ color: '#EF4444' }}>-{itemDiscounts.toLocaleString('uz-UZ')} сўм</span>
            </div>
          )}
          {discountAmount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: '#6B7280' }}>Скидка на заказ {orderDiscountType === 'percent' ? `(${orderDiscount}%)` : ''}</span>
              <span style={{ color: '#EF4444' }}>-{discountAmount.toLocaleString('uz-UZ')} сўм</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 700, paddingTop: 6, borderTop: '1px solid #E5E7EB' }}>
            <span>Итого</span>
            <span style={{ color: '#2563EB' }}>{getTotal().toLocaleString('uz-UZ')} сўм</span>
          </div>
        </div>

        <button
          onClick={onCheckout}
          disabled={items.length === 0}
          style={{
            width: '100%', height: 48, borderRadius: 12, border: 'none', cursor: items.length === 0 ? 'not-allowed' : 'pointer',
            background: '#22C55E', color: '#FFFFFF', fontWeight: 600, fontSize: 15, opacity: items.length === 0 ? 0.5 : 1,
          }}
        >
          Оплата
        </button>
      </div>
    </div>
  );
}
