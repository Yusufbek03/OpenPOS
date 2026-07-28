import { useState } from 'react';
import { api } from '@/lib/api';
import { useKitchenTickets, type KitchenTicket } from '@/hooks/use-kitchen-data';
import { Clock, ChefHat, CheckCircle2, AlertCircle } from 'lucide-react';

function TimeAgo({ date }: { date: string }) {
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  const minutes = Math.floor(diff / 60);
  const seconds = diff % 60;
  const isOvertime = minutes > 10;

  return (
    <span className={`flex items-center gap-1 text-xs font-mono ${isOvertime ? 'text-red-600 font-bold' : 'text-[var(--color-muted)]'}`}>
      <Clock className="w-3 h-3" />
      {minutes > 0 ? `${minutes}м ` : ''}{seconds.toString().padStart(2, '0')}с
    </span>
  );
}

function TicketCard({ ticket, onStatusChange }: { ticket: KitchenTicket; onStatusChange: () => void }) {
  const [loading, setLoading] = useState(false);

  const updateStatus = async (status: string) => {
    setLoading(true);
    try {
      await api.patch(`/kitchen/tickets/${ticket.id}/status`, { status });
      onStatusChange();
    } finally {
      setLoading(false);
    }
  };

  const actions: Record<string, { label: string; next: string; color: string }[]> = {
    NEW: [{ label: 'Принять', next: 'ACCEPTED', color: 'bg-blue-500 hover:bg-blue-600' }],
    ACCEPTED: [{ label: 'Готовлю', next: 'PREPARING', color: 'bg-orange-500 hover:bg-orange-600' }],
    PREPARING: [{ label: 'Готово', next: 'READY', color: 'bg-green-500 hover:bg-green-600' }],
    READY: [{ label: 'Подано', next: 'SERVED', color: 'bg-gray-500 hover:bg-gray-600' }],
  };

  const statusActions = actions[ticket.status] ?? [];
  const canCancel = !['SERVED', 'CANCELLED'].includes(ticket.status);

  return (
    <div className={`bg-[var(--color-surface)] rounded-[var(--radius-lg)] border-2 overflow-hidden shadow-sm transition-all ${
      ticket.status === 'NEW' ? 'border-red-300 animate-pulse' :
      ticket.status === 'ACCEPTED' ? 'border-blue-300' :
      ticket.status === 'PREPARING' ? 'border-orange-300' :
      'border-green-300'
    }`}>
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-[var(--color-border)]">
        <div className="flex items-center gap-2">
          <ChefHat className="w-4 h-4 text-[var(--color-muted)]" />
          <span className="font-bold text-[var(--color-text)]">{ticket.order.orderNumber}</span>
        </div>
        <TimeAgo date={ticket.createdAt} />
      </div>

      <div className="p-4 space-y-2">
        {ticket.order.items.map((item) => (
          <div key={item.id} className="flex items-center gap-3">
            <span className="text-lg font-bold text-[var(--color-primary)] w-8 text-right">
              {Number(item.quantity)}
            </span>
            <div className="flex-1">
              <p className="text-sm font-medium text-[var(--color-text)]">{item.product.nameRu}</p>
              {item.note && (
                <p className="text-xs text-orange-600 mt-0.5">⚠ {item.note}</p>
              )}
            </div>
          </div>
        ))}

        {ticket.order.notes && (
          <div className="mt-3 p-2 bg-yellow-50 rounded-[var(--radius-sm)] border border-yellow-200">
            <p className="text-xs text-yellow-800">📝 {ticket.order.notes}</p>
          </div>
        )}
      </div>

      <div className="px-4 py-3 border-t border-[var(--color-border)] flex gap-2">
        {statusActions.map((action) => (
          <button
            key={action.next}
            onClick={() => updateStatus(action.next)}
            disabled={loading}
            className={`flex-1 h-10 rounded-[var(--radius-md)] text-white text-sm font-medium transition-colors ${action.color} disabled:opacity-50 active:scale-[0.97]`}
          >
            {action.label}
          </button>
        ))}
        {canCancel && (
          <button
            onClick={() => updateStatus('CANCELLED')}
            disabled={loading}
            className="h-10 px-4 rounded-[var(--radius-md)] bg-red-100 text-red-700 text-sm font-medium hover:bg-red-200 disabled:opacity-50"
          >
            <AlertCircle className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

export function KitchenDisplay({ stationId }: { stationId?: string }) {
  const { data: tickets = [], refetch } = useKitchenTickets(stationId);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
      {tickets.length === 0 ? (
        <div className="col-span-full flex flex-col items-center justify-center py-20 text-[var(--color-muted)]">
          <CheckCircle2 className="w-16 h-16 mb-4 text-green-400" />
          <p className="text-lg font-medium">Нет активных заказов</p>
          <p className="text-sm mt-1">Новые заказы появятся здесь автоматически</p>
        </div>
      ) : (
        tickets.map((ticket) => (
          <TicketCard key={ticket.id} ticket={ticket} onStatusChange={refetch} />
        ))
      )}
    </div>
  );
}
