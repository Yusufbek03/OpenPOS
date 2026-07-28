import { useState, useEffect } from 'react';
import { Lock, KeyRound } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { api } from '@/lib/api';

interface LockScreenProps {
  onUnlock: () => void;
}

export function LockScreen({ onUnlock }: LockScreenProps) {
  const user = useAuthStore((s) => s.user);
  const [mode, setMode] = useState<'check' | 'set' | 'confirm' | 'verify'>('check');
  const [pin, setPin] = useState('');
  const [firstPin, setFirstPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPin, setShowPin] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    api.get('/auth/me').then(({ data }) => {
      setMode(data?.hasPinCode ? 'verify' : 'set');
    }).catch(() => setMode('set'));
  }, [user?.id]);

  const handleInput = (d: string) => {
    if (pin.length < 10) { setPin(pin + d); setError(''); }
  };

  const handleDelete = () => { setPin(pin.slice(0, -1)); setError(''); };

  const handleSubmit = async () => {
    if (mode === 'set') {
      if (pin.length < 4) { setError('PIN минимум 4 цифры'); return; }
      setFirstPin(pin);
      setPin('');
      setMode('confirm');
      return;
    }

    if (mode === 'confirm') {
      if (pin !== firstPin) { setError('PIN-коды не совпадают'); setPin(''); return; }
      setLoading(true);
      try {
        await api.post('/auth/set-pin', { userId: user?.id, pin });
        setMode('verify');
        setPin('');
        setFirstPin('');
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Ошибка');
        setPin('');
      } finally { setLoading(false); }
      return;
    }

    if (mode === 'verify') {
      if (!pin) { setError('Введите PIN'); return; }
      setLoading(true);
      try {
        const { data } = await api.post('/auth/verify-pin', { userId: user?.id, pin });
        if (data.valid) { setPin(''); onUnlock(); }
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Неверный PIN');
        setPin('');
      } finally { setLoading(false); }
    }
  };

  const titles: Record<string, string> = {
    set: 'Установите PIN-код',
    confirm: 'Повторите PIN-код',
    verify: 'Введите PIN для разблокировки',
  };

  const canSubmit = mode === 'verify' ? pin.length >= 4 : pin.length >= 4;
  const btnLabel = mode === 'set' ? 'Далее' : mode === 'confirm' ? 'Установить PIN' : 'Разблокировать';
  const btnColor = mode === 'verify' ? '#2563EB' : '#22C55E';

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
    }}>
      <div style={{
        width: 80, height: 80, borderRadius: 20,
        background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20,
      }}>
        {mode === 'check' ? <Lock style={{ width: 36, height: 36, color: '#FFF' }} /> :
          mode === 'verify' ? <Lock style={{ width: 36, height: 36, color: '#FFF' }} /> :
          <KeyRound style={{ width: 36, height: 36, color: '#2563EB' }} />}
      </div>

      <h1 style={{ color: '#FFFFFF', fontSize: 22, fontWeight: 700, marginBottom: 4 }}>
        {user?.fullName || 'Касса заблокирована'}
      </h1>
      <p style={{ color: '#94A3B8', fontSize: 14, marginBottom: 24 }}>
        {mode === 'check' ? 'Загрузка...' : titles[mode]}
      </p>

      {mode !== 'check' && (
        <>
          <div style={{ display: 'flex', gap: 10, marginBottom: 24, justifyContent: 'center' }}>
            {Array.from({ length: Math.max(pin.length, 4) }).map((_, i) => (
              <div key={i} style={{
                width: 16, height: 16, borderRadius: '50%',
                background: i < pin.length ? (mode === 'confirm' && pin !== firstPin && pin.length === firstPin.length ? '#EF4444' : btnColor) : 'rgba(255,255,255,0.2)',
                transition: 'all 0.15s',
              }} />
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 72px)', gap: 12 }}>
            {['1','2','3','4','5','6','7','8','9'].map((d) => (
              <button key={d} onClick={() => handleInput(d)} style={{
                width: 72, height: 72, borderRadius: 16, border: 'none',
                background: 'rgba(255,255,255,0.08)', color: '#FFF', fontSize: 24, fontWeight: 600,
                cursor: 'pointer',
              }}>{d}</button>
            ))}
            <button onClick={() => setShowPin(!showPin)} style={{
              width: 72, height: 72, borderRadius: 16, border: 'none',
              background: 'rgba(255,255,255,0.08)', color: '#94A3B8', fontSize: showPin ? 16 : 18,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {showPin ? (pin || '—') : '👁'}
            </button>
            <button onClick={() => handleInput('0')} style={{
              width: 72, height: 72, borderRadius: 16, border: 'none',
              background: 'rgba(255,255,255,0.08)', color: '#FFF', fontSize: 24, fontWeight: 600,
              cursor: 'pointer',
            }}>0</button>
            <button onClick={handleDelete} style={{
              width: 72, height: 72, borderRadius: 16, border: 'none',
              background: 'rgba(255,255,255,0.08)', color: '#EF4444', fontSize: 18,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>⌫</button>
          </div>

          {error && <p style={{ color: '#EF4444', fontSize: 13, marginTop: 16 }}>{error}</p>}

          {mode === 'confirm' && firstPin && pin.length === firstPin.length && pin !== firstPin && (
            <p style={{ color: '#F59E0B', fontSize: 12, marginTop: 12 }}>PIN-коды не совпадают</p>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading || !canSubmit}
            style={{
              width: 228, height: 48, borderRadius: 14, border: 'none', marginTop: 16,
              background: loading || !canSubmit ? '#475569' : btnColor, color: '#FFF',
              fontSize: 15, fontWeight: 600, cursor: loading || !canSubmit ? 'default' : 'pointer',
            }}
          >
            {loading ? '...' : btnLabel}
          </button>
        </>
      )}
    </div>
  );
}
