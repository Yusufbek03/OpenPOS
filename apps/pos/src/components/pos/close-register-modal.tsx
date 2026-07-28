import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Lock, AlertTriangle, X, Loader2, ShoppingCart } from 'lucide-react';
import { useTheme } from '@/hooks/use-theme';
import { useCartStore } from '@/stores/cart-store';

interface OpenOrder {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  createdAt: string;
  cashier: { fullName: string };
  restaurantTable: { name: string } | null;
}

interface CloseRegisterModalProps {
  open: boolean;
  onClose: () => void;
  onLock: () => void;
}

export function CloseRegisterModal({ open, onClose, onLock }: CloseRegisterModalProps) {
  const { c } = useTheme();
  const cartItems = useCartStore((s) => s.items);

  const { data: openOrdersData, isLoading } = useQuery({
    queryKey: ['open-orders-count'],
    queryFn: async () => {
      const { data } = await api.get('/orders/open');
      return data as { count: number };
    },
    enabled: open,
  });

  const { data: openOrdersList = [], isLoading: isLoadingList } = useQuery({
    queryKey: ['open-orders-list'],
    queryFn: async () => {
      const { data } = await api.get('/orders/open/list');
      return data as OpenOrder[];
    },
    enabled: open,
  });

  if (!open) return null;

  const cartCount = cartItems.length;
  const dbCount = openOrdersData?.count ?? 0;
  const totalOpen = dbCount + cartCount;
  const hasOpenOrders = totalOpen > 0;
  const isChecking = isLoading || isLoadingList;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)' }}>
      <div style={{ background: c.bgCard, borderRadius: 16, width: '100%', maxWidth: 480, margin: '0 16px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: `1px solid ${c.border}` }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: c.text }}>Закрытие кассы</h2>
          <button onClick={onClose} style={{ padding: 4, background: 'none', border: 'none', cursor: 'pointer', borderRadius: 6, color: c.textSecondary }}>
            <X style={{ width: 20, height: 20 }} />
          </button>
        </div>
        <div style={{ padding: 20 }}>
          {isChecking ? (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <Loader2 style={{ width: 32, height: 32, color: c.primary, animation: 'spin 0.6s linear infinite', margin: '0 auto 12px' }} />
              <p style={{ color: c.textSecondary, fontSize: 14 }}>Проверка открытых чеков...</p>
            </div>
          ) : hasOpenOrders ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', background: '#FEF2F2', borderRadius: 10, marginBottom: 16, border: '1px solid #FECACA' }}>
                <AlertTriangle style={{ width: 24, height: 24, color: '#DC2626', flexShrink: 0 }} />
                <div>
                  <p style={{ fontWeight: 700, color: '#DC2626', fontSize: 15 }}>Кассу нельзя закрыть!</p>
                  <p style={{ fontSize: 13, color: '#991B1B', marginTop: 2 }}>Есть <b>{totalOpen}</b> неоплаченных позиций. Оплатите корзину и закройте все заказы.</p>
                </div>
              </div>
              <div style={{ maxHeight: 240, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {cartCount > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: '#FEF2F2', borderRadius: 10, border: '1px solid #FECACA' }}>
                    <ShoppingCart style={{ width: 18, height: 18, color: '#DC2626', flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 500, fontSize: 14, color: '#DC2626' }}>Корзина: {cartCount} товар(ов) не оплачено</p>
                      <p style={{ fontSize: 12, color: '#991B1B' }}>Оплатите или очистите корзину</p>
                    </div>
                  </div>
                )}
                {openOrdersList.map((o) => (
                  <div key={o.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: c.bgSecondary, borderRadius: 10, border: `1px solid ${c.border}` }}>
                    <div>
                      <p style={{ fontWeight: 500, fontSize: 14, color: c.text }}>{o.orderNumber}</p>
                      <p style={{ fontSize: 12, color: c.textSecondary }}>
                        {o.restaurantTable?.name || 'Без стола'} · {o.cashier.fullName}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontWeight: 600, color: '#DC2626' }}>{Number(o.total).toLocaleString('uz-UZ')} сўм</p>
                      <span style={{
                        display: 'inline-block', padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 500,
                        background: '#FEF2F2', color: '#DC2626',
                      }}>
                        Не оплачено
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <button disabled style={{
                width: '100%', height: 44, borderRadius: 10, border: '2px solid #E5E7EB', background: '#F3F4F6', color: '#9CA3AF',
                fontSize: 14, fontWeight: 600, cursor: 'not-allowed', marginTop: 16,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}>
                <Lock style={{ width: 16, height: 16 }} /> Закрытие кассы заблокировано
              </button>
            </div>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 56, height: 56, borderRadius: 16, background: c.successBg, marginBottom: 12 }}>
                <Lock style={{ width: 28, height: 28, color: c.success }} />
              </div>
              <p style={{ fontWeight: 600, fontSize: 16, color: c.text, marginBottom: 4 }}>Все чеки закрыты</p>
              <p style={{ fontSize: 13, color: c.textSecondary, marginBottom: 20 }}>Можно безопасно закрыть кассу.</p>
              <button onClick={() => { onClose(); onLock(); }} style={{
                width: '100%', height: 44, borderRadius: 10, border: 'none', background: c.danger, color: c.textInverse,
                fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}>
                <Lock style={{ width: 16, height: 16 }} /> Подтвердить закрытие кассы
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
