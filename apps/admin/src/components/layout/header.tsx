import { Bell, LogOut } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';

export function Header() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  return (
    <header className="h-14 bg-[var(--color-surface)] border-b border-[var(--color-border)] flex items-center justify-between px-6 shrink-0">
      <div />
      <div className="flex items-center gap-3">
        <button className="p-2 rounded-[var(--radius-sm)] hover:bg-gray-100 text-[var(--color-muted)] relative">
          <Bell className="w-4.5 h-4.5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[var(--color-danger)] rounded-full" />
        </button>
        <div className="flex items-center gap-2 text-sm">
          <div className="w-8 h-8 rounded-full bg-[var(--color-primary)] flex items-center justify-center">
            <span className="text-white text-xs font-medium">{user?.fullName?.charAt(0) ?? 'A'}</span>
          </div>
          <div>
            <p className="font-medium text-[var(--color-text)]">{user?.fullName}</p>
            <p className="text-xs text-[var(--color-muted)]">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={() => logout()}
          className="p-2 rounded-[var(--radius-sm)] hover:bg-gray-100 text-[var(--color-muted)] hover:text-[var(--color-danger)]"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
