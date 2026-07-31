import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth-store';
import { Lock, User, Eye, EyeOff, Mail, Phone, AlertCircle } from 'lucide-react';

interface LoginPageProps {
  onRegister?: () => void;
}

export function LoginPage({ onRegister }: LoginPageProps) {
  const [mode, setMode] = useState<'password' | 'otp'>('password');
  const [tab, setTab] = useState<'email' | 'phone'>('email');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const login = useAuthStore((s) => s.login);

  const handleGoogleLogin = async () => {
    setError('');
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`,
        ...(isStandalone ? {} : {}),
      },
    });
    if (oauthError) setError(oauthError.message);
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await login(username, password);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Ошибка входа');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const contact = tab === 'email' ? username.trim() : username.trim();
      if (!contact) { setError('Введите ' + (tab === 'email' ? 'email' : 'телефон')); setIsLoading(false); return; }

      if (tab === 'email') {
        const { error: otpError } = await supabase.auth.signInWithOtp({ email: contact });
        if (otpError) throw otpError;
      } else {
        const { error: otpError } = await supabase.auth.signInWithOtp({ phone: contact });
        if (otpError) throw otpError;
      }
      setOtpSent(true);
    } catch (err: any) {
      setError(err?.message || 'Ошибка отправки кода');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const contact = username.trim();
      const verifyData = tab === 'email'
        ? { email: contact, token: otpCode, type: 'email' as const }
        : { phone: contact, token: otpCode, type: 'sms' as const };

      const { data, error: verifyError } = await supabase.auth.verifyOtp(verifyData);
      if (verifyError) throw verifyError;

      const supabaseUser = data.user;
      if (!supabaseUser) throw new Error('Пользователь не найден');

      const { api } = await import('@/lib/api');
      const res = await api.post('/auth/supabase-login', {
        email: supabaseUser.email || contact,
        fullName: supabaseUser.user_metadata?.['fullName'] || supabaseUser.email?.split('@')[0] || 'Пользователь',
        phone: supabaseUser.phone || undefined,
        supabaseId: supabaseUser.id,
      });

      localStorage.setItem('pos_access_token', res.data.accessToken);
      localStorage.setItem('pos_refresh_token', res.data.refreshToken);
      localStorage.setItem('pos_user', JSON.stringify(res.data.user));
      window.location.reload();
    } catch (err: any) {
      setError(err?.message || 'Ошибка верификации');
    } finally {
      setIsLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', height: 48, paddingLeft: 44, paddingRight: 16, borderRadius: 10,
    border: '1px solid #D1D5DB', background: '#FFFFFF', fontSize: 15, color: '#111827',
    outline: 'none', boxSizing: 'border-box',
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #EFF6FF 0%, #FFFFFF 50%, #EFF6FF 100%)', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 400, background: '#FFFFFF', borderRadius: 16, boxShadow: '0 8px 40px rgba(0,0,0,0.08)', border: '1px solid #F3F4F6', padding: '40px 32px' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: '#2563EB', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, boxShadow: '0 4px 14px rgba(37,99,235,0.3)' }}>
            <span style={{ color: '#FFFFFF', fontSize: 20, fontWeight: 700 }}>OP</span>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: '#111827', margin: 0 }}>OpenPOS</h1>
          <p style={{ fontSize: 14, color: '#9CA3AF', marginTop: 6 }}>Система управления кафе и рестораном</p>
        </div>

        <div style={{ display: 'flex', gap: 4, background: '#F3F4F6', borderRadius: 10, padding: 4, marginBottom: 24 }}>
          <button onClick={() => { setMode('password'); setError(''); setOtpSent(false); }} style={{ flex: 1, padding: '8px 0', borderRadius: 8, fontSize: 13, fontWeight: 500, border: 'none', cursor: 'pointer', background: mode === 'password' ? '#FFFFFF' : 'transparent', color: mode === 'password' ? '#111827' : '#6B7280', boxShadow: mode === 'password' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>
            Пароль
          </button>
          <button onClick={() => { setMode('otp'); setError(''); setOtpSent(false); }} style={{ flex: 1, padding: '8px 0', borderRadius: 8, fontSize: 13, fontWeight: 500, border: 'none', cursor: 'pointer', background: mode === 'otp' ? '#FFFFFF' : 'transparent', color: mode === 'otp' ? '#111827' : '#6B7280', boxShadow: mode === 'otp' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>
            Код из SMS/Email
          </button>
        </div>

        {mode === 'otp' && !otpSent && (
          <div style={{ display: 'flex', gap: 4, background: '#F3F4F6', borderRadius: 10, padding: 4, marginBottom: 20 }}>
            <button onClick={() => setTab('email')} style={{ flex: 1, padding: '6px 0', borderRadius: 8, fontSize: 12, fontWeight: 500, border: 'none', cursor: 'pointer', background: tab === 'email' ? '#FFFFFF' : 'transparent', color: tab === 'email' ? '#111827' : '#6B7280', boxShadow: tab === 'email' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
              <Mail style={{ width: 12, height: 12 }} /> Gmail
            </button>
            <button onClick={() => setTab('phone')} style={{ flex: 1, padding: '6px 0', borderRadius: 8, fontSize: 12, fontWeight: 500, border: 'none', cursor: 'pointer', background: tab === 'phone' ? '#FFFFFF' : 'transparent', color: tab === 'phone' ? '#111827' : '#6B7280', boxShadow: tab === 'phone' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
              <Phone style={{ width: 12, height: 12 }} /> Телефон
            </button>
          </div>
        )}

        <button onClick={handleGoogleLogin} disabled={isLoading} style={{ width: '100%', height: 48, borderRadius: 10, border: '1px solid #D1D5DB', cursor: 'pointer', background: '#FFFFFF', color: '#374151', fontSize: 15, fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 20 }}>
          <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
          Войти через Google
        </button>

        {mode === 'password' ? (
          <form onSubmit={handlePasswordLogin}>
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
            <button type="submit" disabled={isLoading} style={{ width: '100%', height: 48, borderRadius: 10, border: 'none', cursor: isLoading ? 'not-allowed' : 'pointer', background: '#2563EB', color: '#FFFFFF', fontSize: 16, fontWeight: 600, opacity: isLoading ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
              {isLoading && <span style={{ width: 18, height: 18, border: '2px solid #FFFFFF', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.6s linear infinite', display: 'inline-block' }} />}
              Войти
            </button>
          </form>
        ) : !otpSent ? (
          <form onSubmit={handleSendOtp}>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 500, color: '#374151', marginBottom: 8 }}>{tab === 'email' ? 'Email' : 'Телефон'}</div>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                  {tab === 'email' ? <Mail style={{ width: 18, height: 18, color: '#9CA3AF' }} /> : <Phone style={{ width: 18, height: 18, color: '#9CA3AF' }} />}
                </div>
                <input type={tab === 'email' ? 'email' : 'tel'} value={username} onChange={(e) => setUsername(e.target.value)} placeholder={tab === 'email' ? 'ivan@gmail.com' : '+998 90 123 45 67'} required autoFocus style={inputStyle} />
              </div>
            </div>
            {error && (
              <div style={{ background: '#FEF2F2', color: '#DC2626', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8, borderRadius: 8, padding: '10px 14px', marginBottom: 16 }}>
                <AlertCircle style={{ width: 16, height: 16, flexShrink: 0 }} /> {error}
              </div>
            )}
            <button type="submit" disabled={isLoading} style={{ width: '100%', height: 48, borderRadius: 10, border: 'none', cursor: isLoading ? 'not-allowed' : 'pointer', background: '#2563EB', color: '#FFFFFF', fontSize: 16, fontWeight: 600, opacity: isLoading ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
              {isLoading && <span style={{ width: 18, height: 18, border: '2px solid #FFFFFF', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.6s linear infinite', display: 'inline-block' }} />}
              Отправить код
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp}>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 500, color: '#374151', marginBottom: 8 }}>Код подтверждения</div>
              <input type="text" value={otpCode} onChange={(e) => setOtpCode(e.target.value)} placeholder="000000" required autoFocus maxLength={6} style={{ ...inputStyle, paddingLeft: 16, textAlign: 'center', fontSize: 24, letterSpacing: 8, fontWeight: 600 }} />
            </div>
            <p style={{ fontSize: 13, color: '#9CA3AF', textAlign: 'center', marginBottom: 16 }}>
              Код отправлен на {tab === 'email' ? username : username}
            </p>
            {error && (
              <div style={{ background: '#FEF2F2', color: '#DC2626', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8, borderRadius: 8, padding: '10px 14px', marginBottom: 16 }}>
                <AlertCircle style={{ width: 16, height: 16, flexShrink: 0 }} /> {error}
              </div>
            )}
            <button type="submit" disabled={isLoading || otpCode.length < 4} style={{ width: '100%', height: 48, borderRadius: 10, border: 'none', cursor: isLoading ? 'not-allowed' : 'pointer', background: '#2563EB', color: '#FFFFFF', fontSize: 16, fontWeight: 600, opacity: isLoading || otpCode.length < 4 ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
              {isLoading && <span style={{ width: 18, height: 18, border: '2px solid #FFFFFF', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.6s linear infinite', display: 'inline-block' }} />}
              Войти
            </button>
            <button type="button" onClick={() => { setOtpSent(false); setOtpCode(''); setError(''); }} style={{ width: '100%', marginTop: 10, background: 'none', border: 'none', fontSize: 13, color: '#6B7280', cursor: 'pointer', textDecoration: 'underline' }}>
              Изменить {tab === 'email' ? 'email' : 'телефон'}
            </button>
          </form>
        )}

        {onRegister && (
          <div style={{ textAlign: 'center', marginTop: 20 }}>
            <span style={{ fontSize: 13, color: '#9CA3AF' }}>Нет аккаунта? </span>
            <button onClick={onRegister} style={{ fontSize: 13, fontWeight: 600, color: '#2563EB', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
              Зарегистрироваться
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
