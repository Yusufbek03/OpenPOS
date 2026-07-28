import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface KitchenTicket {
  id: string;
  status: string;
  printedAt: string | null;
  createdAt: string;
  order: {
    id: string;
    orderNumber: string;
    notes: string | null;
    createdAt: string;
    items: {
      id: string;
      quantity: string;
      note: string | null;
      status: string;
      product: { id: string; name: string; nameRu: string };
    }[];
  };
  station: { id: string; name: string };
  printer: { id: string; name: string } | null;
}

export function useKitchenTickets(stationId?: string) {
  return useQuery({
    queryKey: ['kitchen-tickets', stationId],
    queryFn: async () => {
      const { data } = await api.get('/kitchen/tickets', { params: { stationId } });
      return data as KitchenTicket[];
    },
    refetchInterval: 10_000,
  });
}

export function useKitchenStations() {
  return useQuery({
    queryKey: ['kitchen-stations'],
    queryFn: async () => {
      const { data } = await api.get('/kitchen/stations');
      return data as { id: string; name: string; isActive: boolean }[];
    },
  });
}
