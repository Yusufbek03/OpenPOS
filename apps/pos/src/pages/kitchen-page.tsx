import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useSocket } from '@/hooks/use-socket';
import { ChefHat, CheckCircle, Clock, UtensilsCrossed, LogOut, Volume2, VolumeX, CheckCheck } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';

interface KitchenTicket {
  id: string; orderId: string; stationId: string; status: string; createdAt: string;
  order: { id: string; orderNumber: string; notes: string | null; createdAt: string; items: { id: string; quantity: string; note: string | null; status: string; product: { id: string; name: string } }[] };
  station: { id: string; name: string };
}

interface Station { id: string; name: string; isActive: boolean; }

const STATUS_FLOW: Record<string, string> = { NEW: 'ACCEPTED', ACCEPTED: 'PREPARING', PREPARING: 'READY', READY: 'SERVED' };
const STATUS_LABEL: Record<string, string> = { NEW: 'Новый', ACCEPTED: 'Принят', PREPARING: 'Готовится', READY: 'Готов', SERVED: 'Подан' };

function getTimerColor(createdAt: string): string {
  const mins = Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000);
  if (mins < 5) return 'border-blue-500 bg-blue-900/30';
  if (mins < 10) return 'border-green-500 bg-green-900/30';
  if (mins < 15) return 'border-yellow-500 bg-yellow-900/30';
  if (mins < 20) return 'border-orange-500 bg-orange-900/30';
  return 'border-red-500 bg-red-900/30';
}

function getStatusBadge(status: string): string {
  const map: Record<string, string> = {
    NEW: 'bg-blue-500', ACCEPTED: 'bg-yellow-500', PREPARING: 'bg-orange-500', READY: 'bg-green-500', SERVED: 'bg-gray-500',
  };
  return map[status] || 'bg-gray-500';
}

const NOTIFICATION_SOUNDS = [
  'data:audio/wav;base64,UklGRl9vT19teleQBAABAAEAQB8AAEAfAAABAAgAZGF0YQ==',
];

export function KitchenPage() {
  const queryClient = useQueryClient();
  const [stationFilter, setStationFilter] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [selectedTickets, setSelectedTickets] = useState<Set<string>>(new Set());
  const lastTicketCount = useRef(0);
  const logout = useAuthStore((s) => s.logout);
  const { connected, joinKitchen, on } = useSocket();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => { joinKitchen(); }, [joinKitchen]);

  useEffect(() => {
    if (soundEnabled && !audioRef.current) {
      audioRef.current = new Audio(NOTIFICATION_SOUNDS[0]);
      audioRef.current.volume = 0.5;
    }
  }, [soundEnabled]);

  useEffect(() => {
    const unsub1 = on('kitchen:ticket-updated', () => queryClient.invalidateQueries({ queryKey: ['kitchen-tickets'] }));
    const unsub2 = on('order:updated', () => queryClient.invalidateQueries({ queryKey: ['kitchen-tickets'] }));
    return () => { unsub1(); unsub2(); };
  }, [on, queryClient]);

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ['kitchen-tickets'],
    queryFn: async () => {
      const { data } = await api.get('/kitchen/tickets');
      return (data.tickets || data) as KitchenTicket[];
    },
    refetchInterval: connected ? false : 5_000,
  });

  useEffect(() => {
    if (soundEnabled && tickets.length > lastTicketCount.current && lastTicketCount.current > 0) {
      audioRef.current?.play().catch(() => {});
    }
    lastTicketCount.current = tickets.length;
  }, [tickets.length, soundEnabled]);

  const { data: stations = [] } = useQuery({
    queryKey: ['kitchen-stations'],
    queryFn: async () => {
      const { data } = await api.get('/kitchen/stations');
      return (data.stations || data) as Station[];
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ ticketId, status }: { ticketId: string; status: string }) => {
      return api.patch(`/kitchen/tickets/${ticketId}/status`, { status });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['kitchen-tickets'] }),
  });

  const filtered = tickets.filter((t) => !stationFilter || t.stationId === stationFilter);
  const activeTickets = filtered.filter((t) => t.status !== 'SERVED');
  const servedTickets = filtered.filter((t) => t.status === 'SERVED');

  const getElapsed = (createdAt: string) => {
    const mins = Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000);
    if (mins < 60) return `${mins} мин`;
    return `${Math.floor(mins / 60)}ч ${mins % 60}м`;
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedTickets);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedTickets(next);
  };

  const selectAll = () => {
    if (selectedTickets.size === activeTickets.length) {
      setSelectedTickets(new Set());
    } else {
      setSelectedTickets(new Set(activeTickets.map((t) => t.id)));
    }
  };

  const bulkAdvance = () => {
    selectedTickets.forEach((id) => {
      const ticket = tickets.find((t) => t.id === id);
      if (ticket) {
        const next = STATUS_FLOW[ticket.status];
        if (next) updateStatus.mutate({ ticketId: id, status: next });
      }
    });
    setSelectedTickets(new Set());
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gray-900 text-white">
      <header className="h-14 bg-gray-800 border-b border-gray-700 flex items-center px-4 gap-4 shrink-0">
        <div className="flex items-center gap-2">
          <ChefHat className="w-6 h-6 text-orange-400" />
          <span className="font-bold text-lg">Кухня</span>
        </div>
        <div className="flex-1" />
        <button onClick={() => setSoundEnabled(!soundEnabled)} className="p-2 rounded hover:bg-gray-700 text-gray-400 hover:text-white" title={soundEnabled ? 'Выключить звук' : 'Включить звук'}>
          {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>
        {selectedTickets.size > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">{selectedTickets.size} выбрано</span>
            <button onClick={bulkAdvance} className="px-3 py-1 rounded bg-green-600 hover:bg-green-500 text-xs font-medium">Продвинуть все</button>
          </div>
        )}
        <button onClick={selectAll} className="px-3 py-1 rounded bg-gray-700 hover:bg-gray-600 text-xs font-medium">
          <CheckCheck className="w-3 h-3 inline mr-1" />{selectedTickets.size === activeTickets.length ? 'Снять выделение' : 'Выбрать все'}
        </button>
        <div className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-full ${connected ? 'bg-green-900 text-green-400' : 'bg-red-900 text-red-400'}`}>
          {connected ? '● Online' : '● Offline'}
        </div>
        <div className="text-sm text-gray-400">{activeTickets.length} активных</div>
        <button onClick={() => logout()} className="p-2 rounded hover:bg-gray-700 text-gray-400 hover:text-white"><LogOut className="w-4 h-4" /></button>
      </header>

      <div className="flex gap-2 px-4 py-2 bg-gray-800 border-b border-gray-700 overflow-x-auto shrink-0">
        <button onClick={() => setStationFilter(null)} className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${stationFilter === null ? 'bg-orange-500 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>
          Все станции
        </button>
        {stations.filter((s) => s.isActive).map((s) => (
          <button key={s.id} onClick={() => setStationFilter(s.id)} className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${stationFilter === s.id ? 'bg-orange-500 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>
            {s.name}
          </button>
        ))}
      </div>

      <main className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-full"><div className="w-8 h-8 border-3 border-orange-400 border-t-transparent rounded-full animate-spin" /></div>
        ) : activeTickets.length === 0 && servedTickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <UtensilsCrossed className="w-16 h-16 mb-4 opacity-50" />
            <p className="text-lg">Нет заказов</p>
            <p className="text-sm mt-1">Ожидание новых заказов...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activeTickets.length > 0 && (
              <div>
                <h2 className="text-sm font-medium text-gray-400 mb-3 uppercase tracking-wider">Активные ({activeTickets.length})</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {activeTickets.map((ticket) => {
                    const nextStatus = STATUS_FLOW[ticket.status];
                    const elapsed = getElapsed(ticket.createdAt);
                    const borderColor = getTimerColor(ticket.createdAt);
                    const isSelected = selectedTickets.has(ticket.id);
                    return (
                      <div key={ticket.id} className={`rounded-xl border-2 p-4 ${borderColor} transition-all ${isSelected ? 'ring-2 ring-white' : ''}`}>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <button onClick={() => toggleSelect(ticket.id)} className={`w-5 h-5 rounded border-2 flex items-center justify-center ${isSelected ? 'bg-white border-white' : 'border-gray-500'}`}>
                              {isSelected && <CheckCheck className="w-3 h-3 text-gray-900" />}
                            </button>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${getStatusBadge(ticket.status)}`}>{ticket.station.name}</span>
                          </div>
                          <div className="flex items-center gap-1 text-xs"><Clock className="w-3 h-3" /> {elapsed}</div>
                        </div>
                        <p className="font-bold text-lg mb-2">{ticket.order.orderNumber}</p>
                        <div className="space-y-1.5 mb-4">
                          {ticket.order.items.map((item) => (
                            <div key={item.id} className="flex justify-between text-sm">
                              <span>{item.product.name}</span>
                              <span className="font-medium">×{Number(item.quantity)}</span>
                            </div>
                          ))}
                        </div>
                        {ticket.order.notes && <p className="text-xs italic mb-3 opacity-70">📝 {ticket.order.notes}</p>}
                        {ticket.order.items.some((i) => i.note) && (
                          <div className="mb-3 space-y-1">
                            {ticket.order.items.filter((i) => i.note).map((i) => (
                              <p key={i.id} className="text-xs text-yellow-300">⚠️ {i.product.name}: {i.note}</p>
                            ))}
                          </div>
                        )}
                        {nextStatus && (
                          <button onClick={() => updateStatus.mutate({ ticketId: ticket.id, status: nextStatus })} className="w-full py-2.5 rounded-lg bg-white/20 hover:bg-white/30 font-semibold text-sm transition-colors active:scale-[0.98]">
                            {nextStatus === 'READY' ? <><CheckCircle className="w-4 h-4 inline mr-1" /> Готово!</> : STATUS_LABEL[nextStatus]}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {servedTickets.length > 0 && (
              <div>
                <h2 className="text-sm font-medium text-gray-500 mb-3 uppercase tracking-wider">Поданы ({servedTickets.length})</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 opacity-60">
                  {servedTickets.map((ticket) => (
                    <div key={ticket.id} className="rounded-xl border-2 p-4 bg-gray-800 border-gray-700 text-gray-400">
                      <p className="font-bold">{ticket.order.orderNumber}</p>
                      <p className="text-xs mt-1">{STATUS_LABEL[ticket.status]}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
