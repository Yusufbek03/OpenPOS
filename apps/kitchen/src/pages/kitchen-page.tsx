import { useEffect, useState } from 'react';
import { useSocket } from '@/hooks/use-socket';
import { useKitchenStations } from '@/hooks/use-kitchen-data';
import { KitchenDisplay } from '@/components/kitchen-display';
import { Wifi, WifiOff, ChefHat } from 'lucide-react';

export function KitchenPage() {
  const { connected, joinKitchen, on } = useSocket();
  const { data: stations = [] } = useKitchenStations();
  const [selectedStation, setSelectedStation] = useState<string | undefined>();
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    joinKitchen();
  }, [joinKitchen]);

  useEffect(() => {
    const unsub = on('kitchen:ticket', () => {
      setRefreshKey((k) => k + 1);
    });
    return unsub;
  }, [on, refreshKey]);

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      <header className="h-14 bg-[var(--color-surface)] border-b border-[var(--color-border)] flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-[var(--radius-sm)] bg-[var(--color-primary)] flex items-center justify-center">
            <ChefHat className="w-4 h-4 text-white" />
          </div>
          <h1 className="font-semibold text-[var(--color-text)]">Кухня</h1>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedStation(undefined)}
              className={`h-8 px-3 rounded-full text-xs font-medium transition-colors ${
                !selectedStation ? 'bg-[var(--color-primary)] text-white' : 'bg-gray-200 text-[var(--color-muted)] hover:bg-gray-300'
              }`}
            >
              Все
            </button>
            {stations.filter((s) => s.isActive).map((s) => (
              <button
                key={s.id}
                onClick={() => setSelectedStation(s.id)}
                className={`h-8 px-3 rounded-full text-xs font-medium transition-colors ${
                  selectedStation === s.id ? 'bg-[var(--color-primary)] text-white' : 'bg-gray-200 text-[var(--color-muted)] hover:bg-gray-300'
                }`}
              >
                {s.name}
              </button>
            ))}
          </div>

          <div className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-full ${connected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {connected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            {connected ? 'Online' : 'Offline'}
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        <KitchenDisplay key={refreshKey} stationId={selectedStation} />
      </main>
    </div>
  );
}
