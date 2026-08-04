import { useState, useEffect, useRef } from 'react';
import { Search, Users, LogOut, Wifi, WifiOff, Settings, Sun, Moon, Lock, Download, Wallet, Calendar } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { useTheme } from '@/hooks/use-theme';
import { useShiftStore } from '@/stores/shift-store';
import { OpenShiftModal } from './open-shift-modal';
import { CloseShiftModal } from './close-shift-modal';

interface TopBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  isOnline: boolean;
  onAdminClick?: () => void;
  onCloseRegister?: () => void;
  onLogoTripleTap?: () => void;
}

export function TopBar({ searchQuery, onSearchChange, isOnline, onAdminClick, onLogoTripleTap }: TopBarProps) {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { c, toggleTheme, theme } = useTheme();
  const { currentShift, fetchCurrentShift } = useShiftStore();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [canInstall, setCanInstall] = useState(false);
  const [showOpenShift, setShowOpenShift] = useState(false);
  const [showCloseShift, setShowCloseShift] = useState(false);
  const tapCount = useRef(0);
  const tapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { fetchCurrentShift(); }, []);

  const handleLogoTap = () => {
    tapCount.current++;
    if (tapTimer.current) clearTimeout(tapTimer.current);
    tapTimer.current = setTimeout(() => { tapCount.current = 0; }, 800);
    if (tapCount.current >= 3) {
      tapCount.current = 0;
      onLogoTripleTap?.();
    }
  };

  useEffect(() => {
    const handler = (e: any) => { e.preventDefault(); setDeferredPrompt(e); setCanInstall(true); };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') { setCanInstall(false); setDeferredPrompt(null); }
  };

  const shiftTime = currentShift ? new Date(currentShift.openedAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) : '';

  return (
    <>
      <header style={{ height: 56, background: c.bg, borderBottom: `1px solid ${c.border}`, display: 'flex', alignItems: 'center', padding: '0 16px', gap: 16, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', userSelect: 'none' }} onClick={handleLogoTap}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: c.primary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: c.textInverse, fontWeight: 700, fontSize: 13 }}>OP</span>
          </div>
          <span style={{ fontWeight: 600, fontSize: 15, color: c.text }}>OpenPOS</span>
        </div>

        <div style={{ flex: 1, maxWidth: 480, margin: '0 auto', position: 'relative' }}>
          <Search style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: c.textMuted, pointerEvents: 'none' }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Поиск товаров или сканирование штрих-кода..."
            style={{
              width: '100%', height: 36, paddingLeft: 36, paddingRight: 16, borderRadius: 10,
              border: `1px solid ${c.border}`, background: c.bgTertiary, color: c.text, fontSize: 13, outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {currentShift ? (
            <button onClick={() => setShowCloseShift(true)} style={{
              display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, padding: '5px 10px', borderRadius: 8,
              background: c.successBg, color: c.success, fontWeight: 500, border: `1px solid ${c.success}20`, cursor: 'pointer',
            }}>
              <Calendar style={{ width: 13, height: 13 }} />
              Смена открыта · {shiftTime}
            </button>
          ) : (
            <button onClick={() => setShowOpenShift(true)} style={{
              display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, padding: '5px 10px', borderRadius: 8,
              background: c.warningBg || '#FEF3C7', color: '#D97706', fontWeight: 500, border: '1px solid #FCD34D40', cursor: 'pointer',
            }}>
              <Wallet style={{ width: 13, height: 13 }} />
              Открыть смену
            </button>
          )}

          <div style={{
            display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, padding: '4px 10px', borderRadius: 20,
            background: isOnline ? c.successBg : c.dangerBg, color: isOnline ? c.success : c.danger,
          }}>
            {isOnline ? <Wifi style={{ width: 12, height: 12 }} /> : <WifiOff style={{ width: 12, height: 12 }} />}
            {isOnline ? 'Online' : 'Offline'}
          </div>

          <button onClick={toggleTheme} title="Сменить тему" style={{ padding: 6, borderRadius: 8, background: 'none', border: 'none', cursor: 'pointer', color: c.textSecondary }}>
            {theme === 'light' ? <Moon style={{ width: 16, height: 16 }} /> : <Sun style={{ width: 16, height: 16 }} />}
          </button>

          {canInstall && (
            <button onClick={handleInstall} title="Установить приложение" style={{
              display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, padding: '6px 10px', borderRadius: 8,
              background: c.primary, color: c.textInverse, fontWeight: 500, border: 'none', cursor: 'pointer',
            }}>
              <Download style={{ width: 14, height: 14 }} />
            </button>
          )}

          {onAdminClick && (
            <button onClick={onAdminClick} style={{
              display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, padding: '6px 10px', borderRadius: 8,
              background: c.warning, color: c.textInverse, fontWeight: 500, border: 'none', cursor: 'pointer',
            }}>
              <Settings style={{ width: 14, height: 14 }} />
              Админ
            </button>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, color: c.textSecondary }}>
            <Users style={{ width: 16, height: 16 }} />
            <span>{user?.fullName}</span>
          </div>

          <button onClick={() => logout()} style={{ padding: 8, borderRadius: 8, background: 'none', border: 'none', cursor: 'pointer', color: c.textSecondary }}>
            <LogOut style={{ width: 16, height: 16 }} />
          </button>
        </div>
      </header>

      <OpenShiftModal open={showOpenShift} onClose={() => setShowOpenShift(false)} />
      <CloseShiftModal open={showCloseShift} shift={currentShift} onClose={() => setShowCloseShift(false)} />
    </>
  );
}
