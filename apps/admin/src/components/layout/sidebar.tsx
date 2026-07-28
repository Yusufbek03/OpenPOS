import { NavLink } from 'react-router-dom';
import { cn } from '@openpos/ui';
import {
  LayoutDashboard, Package, Tags, ShoppingCart, Users, Building2, Monitor, Printer,
  Truck, BarChart3, Settings, ChefHat,
} from 'lucide-react';

const NAV_ITEMS = [
  { to: '/', icon: LayoutDashboard, label: 'Дашборд' },
  { to: '/products', icon: Package, label: 'Товары' },
  { to: '/categories', icon: Tags, label: 'Категории' },
  { to: '/orders', icon: ShoppingCart, label: 'Заказы' },
  { to: '/kitchen', icon: ChefHat, label: 'Кухня' },
  { to: '/employees', icon: Users, label: 'Сотрудники' },
  { to: '/companies', icon: Building2, label: 'Компании' },
  { to: '/branches', icon: Monitor, label: 'Филиалы' },
  { to: '/printers', icon: Printer, label: 'Принтеры' },
  { to: '/suppliers', icon: Truck, label: 'Поставщики' },
  { to: '/reports', icon: BarChart3, label: 'Отчёты' },
  { to: '/settings', icon: Settings, label: 'Настройки' },
];

export function Sidebar() {
  return (
    <aside className="w-60 bg-[var(--color-surface-dark)] text-[var(--color-text-dark)] flex flex-col shrink-0">
      <div className="h-14 flex items-center px-5 gap-2.5 border-b border-[var(--color-border-dark)]">
        <div className="w-8 h-8 rounded-[var(--radius-sm)] bg-[var(--color-primary)] flex items-center justify-center">
          <span className="text-white font-bold text-sm">OP</span>
        </div>
        <span className="font-semibold text-sm">OpenPOS Admin</span>
      </div>
      <nav className="flex-1 py-3 overflow-y-auto">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-5 py-2.5 text-sm transition-colors',
                isActive
                  ? 'bg-[var(--color-primary-dark)] text-white'
                  : 'text-[var(--color-muted-dark)] hover:text-white hover:bg-white/5',
              )
            }
          >
            <item.icon className="w-4.5 h-4.5" />
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="p-4 border-t border-[var(--color-border-dark)] text-xs text-[var(--color-muted-dark)]">
        v0.1.0
      </div>
    </aside>
  );
}
