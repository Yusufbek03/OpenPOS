import { useState } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { PosPage } from '@/pages/pos-page';
import { AdminDashboard } from './admin-dashboard';
import { AdminProducts } from './admin-products';
import { AdminOrders } from './admin-orders';
import { AdminEmployees } from './admin-employees';
import { AdminCashReport } from './admin-cash-report';
import { AdminCategories } from './admin-categories';
import { AdminPrinters } from './admin-printers';
import { AdminStations } from './admin-stations';
import { AdminCustomers } from './admin-customers';
import { AdminInventory } from './admin-inventory';
import { AdminSuppliers } from './admin-suppliers';
import { AdminSettings } from './admin-settings';
import { AdminAuditLog } from './admin-audit';
import { AdminTables } from './admin-tables';
import { AdminRemovedItems } from './admin-removed-items';
import { LayoutDashboard, Package, ShoppingCart, Users, BarChart3, ArrowLeft, LogOut, Tag, Printer, ChefHat, Contact, Warehouse, Truck, Settings, Shield, Grid3x3, Trash2 } from 'lucide-react';

type AdminView = 'dashboard' | 'products' | 'categories' | 'orders' | 'employees' | 'printers' | 'stations' | 'customers' | 'inventory' | 'suppliers' | 'settings' | 'audit' | 'cash-report' | 'tables' | 'pos' | 'removed-items';

const NAV_ITEMS = [
  { id: 'pos' as AdminView, label: 'Касса', icon: ArrowLeft },
  { id: 'dashboard' as AdminView, label: 'Дашборд', icon: LayoutDashboard },
  { id: 'products' as AdminView, label: 'Товары', icon: Package },
  { id: 'categories' as AdminView, label: 'Категории', icon: Tag },
  { id: 'orders' as AdminView, label: 'Заказы', icon: ShoppingCart },
  { id: 'employees' as AdminView, label: 'Сотрудники', icon: Users },
  { id: 'printers' as AdminView, label: 'Принтеры', icon: Printer },
  { id: 'stations' as AdminView, label: 'Станции', icon: ChefHat },
  { id: 'tables' as AdminView, label: 'Столы', icon: Grid3x3 },
  { id: 'customers' as AdminView, label: 'Клиенты', icon: Contact },
  { id: 'inventory' as AdminView, label: 'Склад', icon: Warehouse },
  { id: 'suppliers' as AdminView, label: 'Поставщики', icon: Truck },
  { id: 'settings' as AdminView, label: 'Настройки', icon: Settings },
  { id: 'audit' as AdminView, label: 'Аудит', icon: Shield },
  { id: 'cash-report' as AdminView, label: 'Отчёт кассы', icon: BarChart3 },
  { id: 'removed-items' as AdminView, label: 'Удалённые', icon: Trash2 },
];

interface AdminPanelProps {
  onBackToPos: () => void;
}

export function AdminPanel({ onBackToPos }: AdminPanelProps) {
  const [view, setView] = useState<AdminView>('dashboard');
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  if (view === 'pos') {
    return <PosPage />;
  }

  return (
    <div className="h-screen flex overflow-hidden">
      <aside style={{ width: 224, background: '#0F172A', color: '#FFFFFF', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '16px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontWeight: 700, fontSize: 13, color: '#fff' }}>OP</span>
            </div>
            <span style={{ fontWeight: 600, fontSize: 14 }}>Admin</span>
          </div>
        </div>

        <nav style={{ flex: 1, padding: '8px 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => item.id === 'pos' ? onBackToPos() : setView(item.id)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 12px',
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 500,
                border: 'none',
                cursor: 'pointer',
                transition: 'background 0.15s',
                background: view === item.id ? '#2563EB' : 'transparent',
                color: view === item.id ? '#FFFFFF' : '#CBD5E1',
              }}
            >
              <item.icon style={{ width: 16, height: 16 }} />
              {item.label}
            </button>
          ))}
        </nav>

        <div style={{ padding: '8px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ padding: '8px 12px', fontSize: 12, color: '#94A3B8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.fullName}</div>
          <button onClick={() => logout()} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 10, fontSize: 14, color: '#CBD5E1', border: 'none', background: 'transparent', cursor: 'pointer' }}>
            <LogOut style={{ width: 16, height: 16 }} />
            Выйти
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto" style={{ background: '#F8FAFC' }}>
        {view === 'dashboard' && <AdminDashboard />}
        {view === 'products' && <AdminProducts />}
        {view === 'categories' && <AdminCategories />}
        {view === 'orders' && <AdminOrders />}
        {view === 'employees' && <AdminEmployees />}
        {view === 'printers' && <AdminPrinters />}
        {view === 'stations' && <AdminStations />}
        {view === 'tables' && <AdminTables />}
        {view === 'customers' && <AdminCustomers />}
        {view === 'inventory' && <AdminInventory />}
        {view === 'suppliers' && <AdminSuppliers />}
        {view === 'settings' && <AdminSettings />}
        {view === 'audit' && <AdminAuditLog />}
        {view === 'cash-report' && <AdminCashReport />}
        {view === 'removed-items' && <AdminRemovedItems />}
      </main>
    </div>
  );
}
