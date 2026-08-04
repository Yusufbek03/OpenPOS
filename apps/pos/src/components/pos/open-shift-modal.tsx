import { useState } from 'react';
import { useShiftStore } from '@/stores/shift-store';
import { useTheme } from '@/hooks/use-theme';
import { Wallet, X, Loader2 } from 'lucide-react';

interface OpenShiftModalProps {
  open: boolean;
  onClose: () => void;
}

export function OpenShiftModal({ open, onClose }: OpenShiftModalProps) {
  const { c } = useTheme();
  const { openShift } = useShiftStore();
  const [balance, setBalance] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  const handleOpen = async () => {
    setLoading(true);
    setError('');
    try {
      await openShift(Number(balance) || 0);
      onClose();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Ошибка';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)' }}>
      <div style={{ background: c.bgCard, borderRadius: 16, width: '100%', maxWidth: 400, margin: '0 16px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: `1px solid ${c.border}` }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: c.text }}>Открытие смены</h2>
          <button onClick={onClose} style={{ padding: 4, background: 'none', border: 'none', cursor: 'pointer', borderRadius: 6, color: c.textSecondary }}><X style={{ width: 20, height: 20 }} /></button>
        </div>
        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ textAlign: 'center', padding: '8px 0' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 56, height: 56, borderRadius: 16, background: c.primaryBg, marginBottom: 12 }}>
              <Wallet style={{ width: 28, height: 28, color: c.primary }} />
            </div>
            <p style={{ fontSize: 13, color: c.textSecondary }}>Введите сумму в кассе на начало смены</p>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: c.text, marginBottom: 6 }}>Начальный баланс</label>
            <input
              type="number"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              placeholder="0"
              style={{ width: '100%', height: 44, padding: '0 12px', borderRadius: 10, border: `1px solid ${c.border}`, fontSize: 16, boxSizing: 'border-box', outline: 'none', background: c.bgCard, color: c.text }}
            />
          </div>
          {error && <p style={{ fontSize: 13, color: c.danger }}>{error}</p>}
          <button onClick={handleOpen} disabled={loading} style={{ width: '100%', height: 44, borderRadius: 10, border: 'none', background: c.primary, color: '#FFFFFF', fontSize: 14, fontWeight: 600, cursor: loading ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: loading ? 0.7 : 1 }}>
            {loading ? <Loader2 style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} /> : <Wallet style={{ width: 16, height: 16 }} />}
            {loading ? 'Открытие...' : 'Открыть смену'}
          </button>
        </div>
      </div>
    </div>
  );
}
