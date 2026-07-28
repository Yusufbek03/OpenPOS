import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Shield, User, Clock, CheckCircle, XCircle } from 'lucide-react';

interface AuditLog {
  id: string; userId: string; action: string; entity: string; entityId: string | null;
  ipAddress: string | null; createdAt: string;
  user: { id: string; fullName: string; username: string };
}

const pageStyle: React.CSSProperties = { padding: 24, display: 'flex', flexDirection: 'column', gap: 20 };
const cardStyle: React.CSSProperties = { background: '#FFFFFF', borderRadius: 16, border: '1px solid #E5E7EB', overflow: 'hidden' };
const thStyle: React.CSSProperties = { padding: '12px 12px', textAlign: 'left', fontSize: 13, color: '#6B7280', borderBottom: '1px solid #E5E7EB', fontWeight: 500 };
const tdStyle: React.CSSProperties = { padding: '12px', fontSize: 14, borderBottom: '1px solid #F3F4F6' };

const ACTION_COLORS: Record<string, string> = {
  CREATE: '#16A34A', UPDATE: '#2563EB', DELETE: '#EF4444', LOGIN: '#8B5CF6', LOGOUT: '#6B7280',
};
const ENTITY_LABELS: Record<string, string> = {
  Order: 'Заказ', Product: 'Товар', Category: 'Категория', Customer: 'Клиент',
  User: 'Сотрудник', Printer: 'Принтер', Inventory: 'Склад', Payment: 'Оплата',
  KitchenStation: 'Станция', Supplier: 'Поставщик', Company: 'Компания',
};

export function AdminAuditLog() {
  const [entityFilter, setEntityFilter] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-audit', entityFilter, page],
    queryFn: async () => {
      const { data } = await api.get('/audit', { params: { limit: 50, page, entity: entityFilter || undefined } });
      return data;
    },
  });

  const logs: AuditLog[] = data?.logs || [];
  const meta = data?.meta;

  return (
    <div style={pageStyle}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>Журнал аудита</h1>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <Shield style={{ width: 18, height: 18, color: '#8B5CF6' }} />
          <span style={{ fontSize: 13, color: '#6B7280' }}>Только для Owner/Admin</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {['', 'Order', 'Product', 'Customer', 'User', 'Payment', 'Inventory'].map((e) => (
          <button key={e} onClick={() => { setEntityFilter(e); setPage(1); }}
            style={{ padding: '6px 14px', borderRadius: 20, border: '1px solid #E5E7EB', background: entityFilter === e ? '#2563EB' : '#FFFFFF', color: entityFilter === e ? '#FFFFFF' : '#374151', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
            {e ? ENTITY_LABELS[e] || e : 'Все'}
          </button>
        ))}
      </div>

      <div style={cardStyle}>
        {isLoading ? (
          <div style={{ padding: 32, textAlign: 'center', color: '#6B7280' }}>Загрузка...</div>
        ) : logs.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', color: '#6B7280' }}>Нет записей</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={thStyle}>Время</th>
                <th style={thStyle}>Пользователь</th>
                <th style={thStyle}>Действие</th>
                <th style={thStyle}>Сущность</th>
                <th style={thStyle}>IP</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => {
                const actionColor = ACTION_COLORS[log.action] || '#6B7280';
                const isDelete = log.action === 'DELETE';
                return (
                  <tr key={log.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                    <td style={{ ...tdStyle, fontSize: 13, color: '#6B7280', whiteSpace: 'nowrap' }}>
                      <Clock style={{ width: 12, height: 12, display: 'inline', marginRight: 4 }} />
                      {new Date(log.createdAt).toLocaleString('ru-RU')}
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 28, height: 28, borderRadius: 8, background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <User style={{ width: 14, height: 14, color: '#6B7280' }} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 500, fontSize: 13 }}>{log.user.fullName}</div>
                          <div style={{ fontSize: 11, color: '#9CA3AF' }}>@{log.user.username}</div>
                        </div>
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <span style={{ fontSize: 12, padding: '4px 10px', borderRadius: 20, fontWeight: 500, background: `${actionColor}15`, color: actionColor }}>
                        {log.action === 'CREATE' && <CheckCircle style={{ width: 12, height: 12, display: 'inline', marginRight: 3 }} />}
                        {isDelete && <XCircle style={{ width: 12, height: 12, display: 'inline', marginRight: 3 }} />}
                        {log.action}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <span style={{ fontSize: 13 }}>{ENTITY_LABELS[log.entity] || log.entity}</span>
                      {log.entityId && <span style={{ fontSize: 11, color: '#9CA3AF', marginLeft: 4 }}>#{log.entityId.slice(0, 8)}</span>}
                    </td>
                    <td style={{ ...tdStyle, fontSize: 13, color: '#6B7280', fontFamily: 'monospace' }}>{log.ipAddress || '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {meta && meta.pages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid #E5E7EB', background: '#FFFFFF', fontSize: 13, cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.5 : 1 }}>← Назад</button>
          <span style={{ fontSize: 13, color: '#6B7280' }}>Стр. {meta.page} из {meta.pages}</span>
          <button onClick={() => setPage(Math.min(meta.pages, page + 1))} disabled={page >= meta.pages} style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid #E5E7EB', background: '#FFFFFF', fontSize: 13, cursor: page >= meta.pages ? 'not-allowed' : 'pointer', opacity: page >= meta.pages ? 0.5 : 1 }}>Далее →</button>
        </div>
      )}
    </div>
  );
}
