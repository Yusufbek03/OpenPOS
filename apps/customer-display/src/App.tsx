import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

interface OrderStatus {
  orderNumber: string;
  status: string;
  items: { name: string; quantity: number; status: string }[];
  total: number;
}

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Черновик',
  PENDING: 'Ожидает',
  SENT_TO_KITCHEN: 'Отправлено на кухню',
  PREPARING: 'Готовится',
  READY: 'Готово',
  COMPLETED: 'Выдан',
  CANCELLED: 'Отменён',
};

const STATUS_COLORS: Record<string, string> = {
  DRAFT: '#6B7280',
  PENDING: '#F59E0B',
  SENT_TO_KITCHEN: '#3B82F6',
  PREPARING: '#F97316',
  READY: '#22C55E',
  COMPLETED: '#22C55E',
  CANCELLED: '#EF4444',
};

export function App() {
  const [order, setOrder] = useState<OrderStatus | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const socket = io(API_BASE, {
      transports: ['websocket', 'polling'],
      reconnection: true,
    });

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    socket.on('order:status', (data: OrderStatus) => {
      setOrder(data);
    });

    socket.on('dashboard:update', (data: OrderStatus) => {
      setOrder(data);
    });

    return () => { socket.disconnect(); };
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-2xl">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center">
              <span className="text-white font-bold">OP</span>
            </div>
            <span className="text-xl font-semibold">OpenPOS</span>
          </div>
          <div className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-full ${connected ? 'bg-green-900 text-green-400' : 'bg-red-900 text-red-400'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-green-400' : 'bg-red-400'}`} />
            {connected ? 'Online' : 'Offline'}
          </div>
        </div>

        {!order ? (
          <div className="text-center py-20">
            <p className="text-2xl text-gray-400 mb-2">Ожидание заказа...</p>
            <p className="text-gray-500">Статус вашего заказа появится здесь</p>
          </div>
        ) : (
          <div className="bg-gray-800 rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-6 text-center border-b border-gray-700">
              <p className="text-gray-400 text-sm mb-1">Заказ</p>
              <p className="text-3xl font-bold mb-3">{order.orderNumber}</p>
              <div
                className="inline-block px-4 py-1.5 rounded-full text-sm font-semibold"
                style={{ backgroundColor: STATUS_COLORS[order.status] + '33', color: STATUS_COLORS[order.status] }}
              >
                {STATUS_LABELS[order.status] ?? order.status}
              </div>
            </div>

            {order.items.length > 0 && (
              <div className="p-6">
                <p className="text-gray-400 text-sm mb-3">Состав заказа</p>
                <div className="space-y-2">
                  {order.items.map((item, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-gray-700 last:border-0">
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold text-blue-400 w-8 text-right">{item.quantity}</span>
                        <span className="text-gray-200">{item.name}</span>
                      </div>
                      <span
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: STATUS_COLORS[item.status] + '33', color: STATUS_COLORS[item.status] }}
                      >
                        {STATUS_LABELS[item.status] ?? item.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="p-6 border-t border-gray-700 text-center">
              <p className="text-gray-400 text-sm">Итого</p>
              <p className="text-2xl font-bold text-green-400">{order.total.toLocaleString('ru-RU')} ₽</p>
            </div>
          </div>
        )}

        <p className="text-center text-gray-600 text-xs mt-8">v0.1.0</p>
      </div>
    </div>
  );
}
