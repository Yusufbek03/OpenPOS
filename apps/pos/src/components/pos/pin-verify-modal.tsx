import { useState } from 'react';
import { Lock, X } from 'lucide-react';
import { useTheme } from '@/hooks/use-theme';
import { useAuthStore } from '@/stores/auth-store';
import { api } from '@/lib/api';

interface PinVerifyModalProps {
  open: boolean;
  onClose: () => void;
  onVerified: () => void;
  title?: string;
}

export function PinVerifyModal({ open, onClose, onVerified, title = 'Введите PIN' }: PinVerifyModalProps) {
  const { c } = useTheme();
  const user = useAuthStore((s) => s.user);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const handleVerify = async () => {
    if (!pin.trim()) { setError('Введите PIN'); return; }
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/auth/verify-pin', { userId: user?.id, pin });
      if (data.valid) {
        setPin('');
        onVerified();
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Неверный PIN');
      setPin('');
    } finally { setLoading(false); }
  };

  const handleInput = (d: string) => { if (pin.length < 10) { setPin(pin + d); setError(''); } };
  const handleDelete = () => { setPin(pin.slice(0, -1)); setError(''); };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)' }}>
      <div style={{ background: c.bgCard, borderRadius: 16, width: '100%', maxWidth: 360, margin: '0 16px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: `1px solid ${c.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Lock style={{ width: 16, height: 16, color: '#EF4444' }} />
            <h2 style={{ fontSize: 15, fontWeight: 600, color: c.text }}>{title}</h2>
          </div>
          <button onClick={() => { setPin(''); setError(''); onClose(); }} style={{ padding: 4, background: 'none', border: 'none', cursor: 'pointer', color: c.textSecondary }}>
            <X style={{ width: 18, height: 18 }} />
          </button>
        </div>
        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 10, marginBottom: 16, justifyContent: 'center' }}>
            {Array.from({ length: Math.max(pin.length, 4) }).map((_, i) => (
              <div key={i} style={{
                width: 14, height: 14, borderRadius: '50%',
                background: i < pin.length ? '#EF4444' : c.border,
                transition: 'all 0.15s',
              }} />
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 60px)', gap: 8 }}>
            {['1','2','3','4','5','6','7','8','9'].map((d) => (
              <button key={d} onClick={() => handleInput(d)} style={{
                width: 60, height: 60, borderRadius: 12, border: 'none',
                background: c.bgSecondary, color: c.text, fontSize: 20, fontWeight: 600, cursor: 'pointer',
              }}>{d}</button>
            ))}
            <div />
            <button onClick={() => handleInput('0')} style={{
              width: 60, height: 60, borderRadius: 12, border: 'none',
              background: c.bgSecondary, color: c.text, fontSize: 20, fontWeight: 600, cursor: 'pointer',
            }}>0</button>
            <button onClick={handleDelete} style={{
              width: 60, height: 60, borderRadius: 12, border: 'none',
              background: c.bgSecondary, color: '#EF4444', fontSize: 16, cursor: 'pointer',
            }}>⌫</button>
          </div>

          {error && <p style={{ color: '#EF4444', fontSize: 12, marginTop: 12 }}>{error}</p>}

          <button
            onClick={handleVerify}
            disabled={loading || pin.length < 4}
            style={{
              width: '100%', height: 40, borderRadius: 10, border: 'none', marginTop: 12,
              background: loading || pin.length < 4 ? c.bgSecondary : '#EF4444', color: '#FFFFFF',
              fontSize: 13, fontWeight: 600, cursor: loading || pin.length < 4 ? 'default' : 'pointer',
            }}
          >
            {loading ? 'Проверка...' : 'Подтвердить'}
          </button>
        </div>
      </div>
    </div>
  );
}
