import { useAuthStore } from '@/stores/auth-store';
import { PosPage } from '@/pages/pos-page';
import { KitchenPage } from '@/pages/kitchen-page';

export function RoleRouter() {
  const user = useAuthStore((s) => s.user);

  if (!user) return null;

  if (user.role === 'COOK') {
    return <KitchenPage />;
  }

  return <PosPage showAdmin />;
}
