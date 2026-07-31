import { useState, useEffect, useCallback, useRef, Suspense, lazy } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { TopBar } from '@/components/pos/top-bar';
import { ProductGrid } from '@/components/pos/product-grid';
import { Cart } from '@/components/pos/cart';
import { PaymentModal } from '@/components/pos/payment-modal';
import { CloseRegisterModal } from '@/components/pos/close-register-modal';
import { LockScreen } from '@/components/pos/lock-screen';
import { useProducts, useProductSearch, useCategories } from '@/hooks/use-pos-data';
import { useAuthStore } from '@/stores/auth-store';
import { useCartStore } from '@/stores/cart-store';
import { ArrowLeft } from 'lucide-react';
import { useTheme } from '@/hooks/use-theme';

const AdminPanel = lazy(() => import('@/pages/admin/admin-panel').then(m => ({ default: m.AdminPanel })));
const AdminGate = lazy(() => import('@/pages/admin/admin-gate').then(m => ({ default: m.AdminGate })));

interface PosPageProps {
  showAdmin?: boolean;
}

export function PosPage({ showAdmin }: PosPageProps) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showPayment, setShowPayment] = useState(false);
  const [showCloseRegister, setShowCloseRegister] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [view, setView] = useState<'pos' | 'admin-gate' | 'admin'>('pos');
  const [adminRevealed, setAdminRevealed] = useState(false);
  const queryClient = useQueryClient();
  const { c } = useTheme();

  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'OWNER' || user?.role === 'ADMINISTRATOR';

  const { data: categories = [] } = useCategories();
  const activeCategories = categories.filter((c) => c.isActive);

  const isSearching = searchQuery.length >= 2;
  const { data: searchResults = [] } = useProductSearch(searchQuery);
  const { data: catalogProducts = [], isLoading } = useProducts(
    isSearching ? undefined : { categoryId: selectedCategoryId ?? undefined },
  );

  const products = isSearching ? searchResults : catalogProducts;
  const selectedCategory = activeCategories.find((c) => c.id === selectedCategoryId);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    }, 30_000);
    return () => clearInterval(interval);
  }, [queryClient]);

  const handleBarcodeScan = useCallback((barcode: string) => {
    setSearchQuery(barcode);
  }, []);

  const clearCart = useCartStore((s) => s.clearCart);
  const items = useCartStore((s) => s.items);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const handleKeyboard = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        if (e.key === 'Escape') (e.target as HTMLInputElement).blur();
        return;
      }
      switch (e.key) {
        case 'F1':
          e.preventDefault();
          searchInputRef.current?.focus();
          break;
        case 'F2':
          e.preventDefault();
          if (items.length > 0 && confirm('Очистить корзину?')) clearCart();
          break;
        case 'F4':
          e.preventDefault();
          if (items.length > 0) setShowPayment(true);
          break;
        case 'Escape':
          e.preventDefault();
          if (showPayment) setShowPayment(false);
          else if (selectedCategoryId) { setSelectedCategoryId(null); setSearchQuery(''); }
          else if (searchQuery) setSearchQuery('');
          break;
        case 'Backspace':
          if (!searchQuery) {
            e.preventDefault();
            if (selectedCategoryId) setSelectedCategoryId(null);
          }
          break;
      }
    };
    window.addEventListener('keydown', handleKeyboard);
    return () => window.removeEventListener('keydown', handleKeyboard);
  }, [items.length, showPayment, selectedCategoryId, searchQuery, clearCart]);

  useEffect(() => {
    let buffer = '';
    let lastTime = 0;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const now = Date.now();
      if (now - lastTime > 100) buffer = '';
      lastTime = now;
      if (e.key === 'Enter' && buffer.length >= 3) {
        handleBarcodeScan(buffer);
        buffer = '';
        return;
      }
      buffer += e.key;
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleBarcodeScan]);

  if (isAdmin && view === 'admin-gate' && showAdmin) {
    return <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#6B7280' }}>Загрузка...</div>}><AdminGate onUnlock={() => setView('admin')} /></Suspense>;
  }

  if (isAdmin && view === 'admin' && showAdmin) {
    return <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#6B7280' }}>Загрузка...</div>}><AdminPanel onBackToPos={() => setView('pos')} /></Suspense>;
  }

  if (isLocked) {
    return <LockScreen onUnlock={() => setIsLocked(false)} />;
  }

  const showCategoryGrid = !selectedCategoryId && !isSearching;

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: c.bgSecondary }}>
      <TopBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        isOnline={isOnline}
        onAdminClick={isAdmin && (showAdmin || adminRevealed) ? () => setView('admin-gate') : undefined}
        onCloseRegister={() => setShowCloseRegister(true)}
        onLogoTripleTap={() => { if (isAdmin) setAdminRevealed(true); }}
      />

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {showCategoryGrid ? (
            /* === Экран 1: Категории === */
            <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 16 }}>
                {activeCategories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategoryId(cat.id)}
                    style={{
                      height: 140, borderRadius: 16, border: `1px solid ${c.border}`, cursor: 'pointer',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10,
                      background: c.bgCard, transition: 'all 0.15s', overflow: 'hidden',
                    }}
                  >
                    {cat.imageUrl ? (
                      <img src={cat.imageUrl} alt={cat.nameRu} style={{ width: 80, height: 80, borderRadius: 16, objectFit: 'cover' }} />
                    ) : cat.color ? (
                      <div style={{ width: 64, height: 64, borderRadius: 16, background: cat.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: 36 }}>{cat.icon || '📁'}</span>
                      </div>
                    ) : (
                      <span style={{ fontSize: 48 }}>{cat.icon || '📁'}</span>
                    )}
                    <span style={{ fontSize: 14, fontWeight: 600, color: c.text }}>{cat.nameRu}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* === Экран 2: Товары категории === */
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', background: c.bg, borderBottom: `1px solid ${c.border}`, flexShrink: 0 }}>
                <button
                  onClick={() => { setSelectedCategoryId(null); setSearchQuery(''); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8,
                    background: c.bgTertiary, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500, color: c.text,
                  }}
                >
                  <ArrowLeft style={{ width: 16, height: 16 }} />
                  Назад
                </button>
                {selectedCategory && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 22 }}>{selectedCategory.icon}</span>
                    <span style={{ fontSize: 16, fontWeight: 600, color: c.text }}>{selectedCategory.nameRu}</span>
                  </div>
                )}
              </div>
              {isLoading ? (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ width: 32, height: 32, border: '3px solid #2563EB', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
                </div>
              ) : (
                <ProductGrid products={products} />
              )}
            </>
          )}
        </div>

        <Cart onCheckout={() => setShowPayment(true)} />
      </div>

      <PaymentModal open={showPayment} onClose={() => setShowPayment(false)} onCompleted={() => {}} />
      <CloseRegisterModal open={showCloseRegister} onClose={() => setShowCloseRegister(false)} onLock={() => setIsLocked(true)} />
    </div>
  );
}
