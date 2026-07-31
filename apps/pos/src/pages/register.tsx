import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';
import { Mail, Phone, Eye, EyeOff, ArrowLeft, AlertCircle } from 'lucide-react';

interface RegisterPageProps {
  onBack: () => void;
}

export function RegisterPage({ onBack }: RegisterPageProps) {
  const [tab, setTab] = useState<'email' | 'phone'>('email');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [step, setStep] = useState<'form' | 'verify'>('form');

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!fullName.trim()) { setError('Введите имя'); return; }
    if (tab === 'email' && !email.trim()) { setError('Введите email'); return; }
    if (tab === 'phone' && !phone.trim()) { setError('Введите телефон'); return; }
    if (password.length < 6) { setError('Пароль минимум 6 символов'); return; }

    setIsLoading(true);
    try {
      if (tab === 'email') {
        const { error: otpError } = await supabase.auth.signInWithOtp({
          email: email.trim(),
          options: { data: { fullName: fullName.trim() } },
        });
        if (otpError) throw otpError;
      } else {
        const { error: otpError } = await supabase.auth.signInWithOtp({
          phone: phone.trim(),
        });
        if (otpError) throw otpError;
      }
      setSent(true);
      setStep('verify');
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
      const verifyData = tab === 'email'
        ? { email: email.trim(), token: otpCode, type: 'email' as const }
        : { phone: phone.trim(), token: otpCode, type: 'sms' as const };

      const { data, error: verifyError } = await supabase.auth.verifyOtp(verifyData);
      if (verifyError) throw verifyError;

      const supabaseUser = data.user;
      if (!supabaseUser) throw new Error('Пользователь не найден');

      await api.post('/auth/supabase-login', {
        email: supabaseUser.email || email.trim(),
        fullName: fullName.trim(),
        phone: supabaseUser.phone || phone.trim() || undefined,
        supabaseId: supabaseUser.id,
      }).then((res) => {
        localStorage.setItem('pos_access_token', res.data.accessToken);
        localStorage.setItem('pos_refresh_token', res.data.refreshToken);
        localStorage.setItem('pos_user', JSON.stringify(res.data.user));
        useAuthStore.setState({ user: res.data.user, isAuthenticated: true });
      });
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

  if (step === 'verify' && sent) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #EFF6FF 0%, #FFFFFF 50%, #EFF6FF 100%)', padding: 20 }}>
        <div style={{ width: '100%', maxWidth: 400, background: '#FFFFFF', borderRadius: 16, boxShadow: '0 8px 40px rgba(0,0,0,0.08)', border: '1px solid #F3F4F6', padding: '40px 32px' }}>
          <button onClick={() => { setStep('form'); setSent(false); }} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#6B7280', marginBottom: 20, padding: 0 }}>
            <ArrowLeft style={{ width: 16, height: 16 }} /> Назад
          </button>

          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{ width: 56, height: 56, borderRadius: 14, background: '#22C55E', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <Mail style={{ width: 28, height: 28, color: '#FFFFFF' }} />
            </div>
            <h1 style={{ fontSize: 20, fontWeight: 600, color: '#111827', margin: 0 }}>Код подтверждения</h1>
            <p style={{ fontSize: 14, color: '#9CA3AF', marginTop: 6 }}>
              Код отправлен на {tab === 'email' ? email : phone}
            </p>
          </div>

          <form onSubmit={handleVerifyOtp}>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 500, color: '#374151', marginBottom: 8 }}>Введите код</div>
              <input
                type="text"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                placeholder="000000"
                required
                autoFocus
                maxLength={6}
                style={{ ...inputStyle, paddingLeft: 16, textAlign: 'center', fontSize: 24, letterSpacing: 8, fontWeight: 600 }}
              />
            </div>

            {error && (
              <div style={{ background: '#FEF2F2', color: '#DC2626', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8, borderRadius: 8, padding: '10px 14px', marginBottom: 16 }}>
                <AlertCircle style={{ width: 16, height: 16, flexShrink: 0 }} /> {error}
              </div>
            )}

            <button type="submit" disabled={isLoading || otpCode.length < 4} style={{ width: '100%', height: 48, borderRadius: 10, border: 'none', cursor: isLoading ? 'not-allowed' : 'pointer', background: '#22C55E', color: '#FFFFFF', fontSize: 16, fontWeight: 600, opacity: isLoading || otpCode.length < 4 ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
              {isLoading && <span style={{ width: 18, height: 18, border: '2px solid #FFFFFF', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.6s linear infinite', display: 'inline-block' }} />}
              Подтвердить
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #EFF6FF 0%, #FFFFFF 50%, #EFF6FF 100%)', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 400, background: '#FFFFFF', borderRadius: 16, boxShadow: '0 8px 40px rgba(0,0,0,0.08)', border: '1px solid #F3F4F6', padding: '40px 32px' }}>
        <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#6B7280', marginBottom: 20, padding: 0 }}>
          <ArrowLeft style={{ width: 16, height: 16 }} /> Назад к входу
        </button>

        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: '#22C55E', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, boxShadow: '0 4px 14px rgba(34,197,94,0.3)' }}>
            <span style={{ color: '#FFFFFF', fontSize: 20, fontWeight: 700 }}>OP</span>
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 600, color: '#111827', margin: 0 }}>Регистрация</h1>
          <p style={{ fontSize: 14, color: '#9CA3AF', marginTop: 6 }}>Создайте новый аккаунт</p>
        </div>

        <div style={{ display: 'flex', gap: 4, background: '#F3F4F6', borderRadius: 10, padding: 4, marginBottom: 24 }}>
          <button onClick={() => setTab('email')} style={{ flex: 1, padding: '8px 0', borderRadius: 8, fontSize: 13, fontWeight: 500, border: 'none', cursor: 'pointer', background: tab === 'email' ? '#FFFFFF' : 'transparent', color: tab === 'email' ? '#111827' : '#6B7280', boxShadow: tab === 'email' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <Mail style={{ width: 14, height: 14 }} /> Gmail
          </button>
          <button onClick={() => setTab('phone')} style={{ flex: 1, padding: '8px 0', borderRadius: 8, fontSize: 13, fontWeight: 500, border: 'none', cursor: 'pointer', background: tab === 'phone' ? '#FFFFFF' : 'transparent', color: tab === 'phone' ? '#111827' : '#6B7280', boxShadow: tab === 'phone' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <Phone style={{ width: 14, height: 14 }} /> Телефон
          </button>
        </div>

        <form onSubmit={handleSendOtp}>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 500, color: '#374151', marginBottom: 8 }}>Имя</div>
            <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Иван Иванов" required autoFocus style={{ ...inputStyle, paddingLeft: 16 }} />
          </div>

          {tab === 'email' ? (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 500, color: '#374151', marginBottom: 8 }}>Email (Gmail)</div>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                  <Mail style={{ width: 18, height: 18, color: '#9CA3AF' }} />
                </div>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ivan@gmail.com" required style={inputStyle} />
              </div>
            </div>
          ) : (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 500, color: '#374151', marginBottom: 8 }}>Телефон</div>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                  <Phone style={{ width: 18, height: 18, color: '#9CA3AF' }} />
                </div>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+998 90 123 45 67" required style={inputStyle} />
              </div>
            </div>
          )}

          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 500, color: '#374151', marginBottom: 8 }}>Пароль</div>
            <div style={{ position: 'relative' }}>
              <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Минимум 6 символов" required style={{ ...inputStyle, paddingLeft: 16 }} />
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

          <button type="submit" disabled={isLoading} style={{ width: '100%', height: 48, borderRadius: 10, border: 'none', cursor: isLoading ? 'not-allowed' : 'pointer', background: '#22C55E', color: '#FFFFFF', fontSize: 16, fontWeight: 600, opacity: isLoading ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            {isLoading && <span style={{ width: 18, height: 18, border: '2px solid #FFFFFF', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.6s linear infinite', display: 'inline-block' }} />}
            Отправить код
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <span style={{ fontSize: 13, color: '#9CA3AF' }}>Уже есть аккаунт? </span>
          <button onClick={onBack} style={{ fontSize: 13, fontWeight: 600, color: '#2563EB', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
            Войти
          </button>
        </div>
      </div>
    </div>
  );
}
