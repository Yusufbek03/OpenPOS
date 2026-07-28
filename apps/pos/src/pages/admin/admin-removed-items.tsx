import { useRemovedItemsStore } from '@/stores/removed-items-store';
import { Trash2, Clock, User } from 'lucide-react';

const pageStyle: React.CSSProperties = { padding: 24, display: 'flex', flexDirection: 'column', gap: 20 };
const cardStyle: React.CSSProperties = { background: '#FFFFFF', borderRadius: 16, border: '1px solid #E5E7EB', overflow: 'hidden' };

export function AdminRemovedItems() {
  const items = useRemovedItemsStore((s) => s.items);
  const clearItems = useRemovedItemsStore((s) => s.clearItems);

  const totalAmount = items.reduce((sum, ri) => sum + Number(ri.item.total), 0);

  return (
    <div style={pageStyle}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>Удалённые товары</h1>
        {items.length > 0 && (
          <button onClick={() => { if (confirm('Очистить историю удалений?')) clearItems(); }}
            style={{ padding: '8px 16px', borderRadius: 10, border: 'none', background: '#F3F4F6', color: '#6B7280', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
            Очистить историю
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
        <div style={{ ...cardStyle, padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Trash2 style={{ width: 20, height: 20, color: '#EF4444' }} />
            </div>
            <div>
              <p style={{ fontSize: 13, color: '#6B7280' }}>Всего удалений</p>
              <p style={{ fontSize: 20, fontWeight: 700 }}>{items.length}</p>
            </div>
          </div>
        </div>
        <div style={{ ...cardStyle, padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 20 }}>💰</span>
            </div>
            <div>
              <p style={{ fontSize: 13, color: '#6B7280' }}>Сумма удалённых</p>
              <p style={{ fontSize: 20, fontWeight: 700 }}>{totalAmount.toLocaleString('uz-UZ')} сўм</p>
            </div>
          </div>
        </div>
      </div>

      {items.length === 0 ? (
        <div style={{ ...cardStyle, padding: 48, textAlign: 'center' }}>
          <span style={{ fontSize: 48 }}>✅</span>
          <p style={{ fontSize: 15, fontWeight: 500, color: '#6B7280', marginTop: 12 }}>Нет удалённых товаров</p>
          <p style={{ fontSize: 13, color: '#9CA3AF', marginTop: 4 }}>Удалённые товары из корзины будут отображаться здесь</p>
        </div>
      ) : (
        <div style={cardStyle}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #E5E7EB', display: 'grid', gridTemplateColumns: '1fr 120px 100px 140px 160px', gap: 12, fontSize: 12, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase' }}>
            <span>Товар</span>
            <span>Кол-во</span>
            <span>Цена</span>
            <span>Сумма</span>
            <span>Удалён</span>
          </div>
          <div style={{ maxHeight: 500, overflowY: 'auto' }}>
            {items.map((ri) => (
              <div key={ri.id} style={{ padding: '10px 16px', borderBottom: '1px solid #F3F4F6', display: 'grid', gridTemplateColumns: '1fr 120px 100px 140px 160px', gap: 12, fontSize: 13, alignItems: 'center' }}>
                <div>
                  <p style={{ fontWeight: 500 }}>{ri.item.product.nameRu}</p>
                  <p style={{ fontSize: 11, color: '#9CA3AF' }}>ID: {ri.item.productId.slice(0, 8)}</p>
                </div>
                <span>{ri.item.quantity}</span>
                <span>{Number(ri.item.unitPrice).toLocaleString('uz-UZ')}</span>
                <span style={{ fontWeight: 600, color: '#EF4444' }}>{Number(ri.item.total).toLocaleString('uz-UZ')} сўм</span>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <User style={{ width: 12, height: 12, color: '#9CA3AF' }} />
                    <span style={{ fontSize: 12 }}>{ri.removedByName}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                    <Clock style={{ width: 12, height: 12, color: '#9CA3AF' }} />
                    <span style={{ fontSize: 11, color: '#9CA3AF' }}>{new Date(ri.removedAt).toLocaleString('ru-RU')}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
