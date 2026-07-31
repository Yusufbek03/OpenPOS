import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth-store';
import { setAuthExpiredCallback } from '@/lib/api';
import { LoginPage } from '@/pages/login';
import { RegisterPage } from '@/pages/register';
import { RoleRouter } from '@/components/role-router';

async function syncSupabaseUser(): Promise<boolean> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return false;

    const { api } = await import('@/lib/api');
    const res = await api.post('/auth/supabase-login', {
      email: session.user.email || '',
      fullName: session.user.user_metadata?.['full_name'] || session.user.user_metadata?.['fullName'] || session.user.email?.split('@')[0] || 'Пользователь',
      phone: session.user.phone || undefined,
      supabaseId: session.user.id,
    });
    localStorage.setItem('pos_access_token', res.data.accessToken);
    localStorage.setItem('pos_refresh_token', res.data.refreshToken);
    localStorage.setItem('pos_user', JSON.stringify(res.data.user));
    return true;
  } catch (err) {
    console.error('Supabase sync error:', err);
    return false;
  }
}

export function App() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const loadUser = useAuthStore((s) => s.loadUser);
  const [ready, setReady] = useState(false);
  const [view, setView] = useState<'login' | 'register'>('login');

  useEffect(() => {
    setAuthExpiredCallback(() => {
      useAuthStore.setState({ user: null, isAuthenticated: false });
    });
    syncSupabaseUser().then(() => loadUser().finally(() => setReady(true)));
  }, [loadUser]);

  if (!ready) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#FFFFFF', fontSize: 20, fontWeight: 700 }}>OP</span>
          </div>
          <div style={{ width: 32, height: 32, border: '3px solid #2563EB', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    if (view === 'register') {
      return <RegisterPage onBack={() => setView('login')} />;
    }
    return <LoginPage onRegister={() => setView('register')} />;
  }

  return <RoleRouter />;
}
