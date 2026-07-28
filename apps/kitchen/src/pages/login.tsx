import { useState } from 'react';
import { api } from '@/lib/api';
import { Lock, User } from 'lucide-react';

export function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/auth/login', { username, password });
      localStorage.setItem('kitchen_token', data.accessToken);
      localStorage.setItem('kitchen_refresh', data.refreshToken);
      window.location.href = '/';
    } catch {
      setError('Неверное имя пользователя или пароль');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="w-full max-w-sm mx-4">
        <div className="bg-[var(--color-surface)] rounded-[var(--radius-xl)] shadow-xl p-8">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 rounded-[var(--radius-lg)] bg-orange-500 flex items-center justify-center mb-4">
              <span className="text-white text-2xl">👨‍🍳</span>
            </div>
            <h1 className="text-xl font-bold text-[var(--color-text)]">Кухонный дисплей</h1>
            <p className="text-sm text-[var(--color-muted)] mt-1">Войдите для просмотра заказов</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-text)] mb-1">Логин</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-muted)]" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Введите логин"
                  className="w-full h-10 pl-10 pr-3 rounded-[var(--radius-md)] border border-[var(--color-border)] text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  required
                  autoFocus
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-text)] mb-1">Пароль</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-muted)]" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Введите пароль"
                  className="w-full h-10 pl-10 pr-3 rounded-[var(--radius-md)] border border-[var(--color-border)] text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  required
                />
              </div>
            </div>
            {error && <p className="text-sm text-red-500 text-center">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-10 rounded-[var(--radius-md)] bg-orange-500 text-white font-medium text-sm hover:bg-orange-600 transition-colors disabled:opacity-50"
            >
              {loading ? 'Вход...' : 'Войти'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
