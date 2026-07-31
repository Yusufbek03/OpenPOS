import { useState } from 'react';
import { Lock, Eye, EyeOff, User, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { api } from '@/lib/api';

interface AdminGateProps {
  onUnlock: () => void;
}

export function AdminGate({ onUnlock }: AdminGateProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const { data } = await api.post('/auth/login', {
        username: username.trim(),
        password,
      }, {
        headers: { 'x-device-id': 'admin-gate' },
      });

      const role = data.user?.role;
      if (role !== 'OWNER' && role !== 'ADMINISTRATOR') {
        setError('Только владелец или управляющий имеет доступ');
        return;
      }

      onUnlock();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Неверный логин или пароль');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data } = await api.post('/auth/supabase-login', {
          email: session.user.email || '',
          fullName: session.user.user_metadata?.['full_name'] || session.user.email?.split('@')[0] || '',
          supabaseId: session.user.id,
        });
        const role = data.user?.role;
        if (role !== 'OWNER' && role !== 'ADMINISTRATOR') {
          setError('Только владелец или управляющий имеет доступ');
          setIsLoading(false);
          return;
        }
        onUnlock();
        return;
      }

      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/` },
      });
      if (oauthError) throw oauthError;
    } catch (err: any) {
      setError(err?.message || 'Ошибка входа через Google');
      setIsLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', height: 48, paddingLeft: 44, paddingRight: 16, borderRadius: 10,
    border: '1px solid #D1D5DB', background: '#FFFFFF', fontSize: 15, color: '#111827',
    outline: 'none', boxSizing: 'border-box',
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F3F4F6', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 400, background: '#FFFFFF', borderRadius: 16, boxShadow: '0 8px 40px rgba(0,0,0,0.08)', border: '1px solid #F3F4F6', padding: '40px 32px' }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: '#F59E0B', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <Lock style={{ width: 24, height: 24, color: '#FFFFFF' }} />
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 600, color: '#111827', margin: 0 }}>Панель администратора</h1>
          <p style={{ fontSize: 14, color: '#9CA3AF', marginTop: 6 }}>Введите логин и пароль администратора</p>
        </div>

        <button onClick={handleGoogleLogin} disabled={isLoading} style={{ width: '100%', height: 48, borderRadius: 10, border: '1px solid #D1D5DB', cursor: 'pointer', background: '#FFFFFF', color: '#374151', fontSize: 15, fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 20, opacity: isLoading ? 0.6 : 1 }}>
          <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
          Войти через Google
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{ flex: 1, height: 1, background: '#E5E7EB' }} />
          <span style={{ fontSize: 13, color: '#9CA3AF' }}>или</span>
          <div style={{ flex: 1, height: 1, background: '#E5E7EB' }} />
        </div>

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 500, color: '#374151', marginBottom: 8 }}>Логин</div>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                <User style={{ width: 18, height: 18, color: '#9CA3AF' }} />
              </div>
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="admin" required autoFocus style={inputStyle} />
            </div>
          </div>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 500, color: '#374151', marginBottom: 8 }}>Пароль</div>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                <Lock style={{ width: 18, height: 18, color: '#9CA3AF' }} />
              </div>
              <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="admin123" required style={inputStyle} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', padding: 4, cursor: 'pointer' }}>
                {showPassword ? <EyeOff style={{ width: 18, height: 18, color: '#6B7280' }} /> : <Eye style={{ width: 18, height: 18, color: '#6B7280' }} />}
              </button>
            </div>
          </div>
          {error && (
            <div style={{ background: '#FEF2F2', color: '#DC2626', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8, borderRadius: 8, padding: '10px 14px', marginBottom: 16 }}>
              <AlertCircle style={{ width: 16, height: 16, flexShrink: 0 }} /> {error}
            </div>
          )}
          <button type="submit" disabled={isLoading} style={{ width: '100%', height: 48, borderRadius: 10, border: 'none', background: '#F59E0B', color: '#FFFFFF', fontSize: 16, fontWeight: 600, cursor: isLoading ? 'not-allowed' : 'pointer', opacity: isLoading ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            {isLoading && <span style={{ width: 18, height: 18, border: '2px solid #FFFFFF', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.6s linear infinite', display: 'inline-block' }} />}
            Войти в админку
          </button>
        </form>
      </div>
    </div>
  );
}
