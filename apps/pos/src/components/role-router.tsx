import { Suspense, lazy } from 'react';
import { useAuthStore } from '@/stores/auth-store';

const PosPage = lazy(() => import('@/pages/pos-page').then(m => ({ default: m.PosPage })));
const KitchenPage = lazy(() => import('@/pages/kitchen-page').then(m => ({ default: m.KitchenPage })));

export function RoleRouter() {
  const user = useAuthStore((s) => s.user);

  if (!user) return null;

  return (
    <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#6B7280' }}>Загрузка...</div>}>
      {user.role === 'COOK' ? <KitchenPage /> : <PosPage />}
    </Suspense>
  );
}
