import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '@/lib/api';

export interface Shift {
  id: string;
  cashierId: string;
  branchId: string;
  status: 'OPEN' | 'CLOSED';
  openingBalance: number;
  closingBalance: number | null;
  cashCount: number | null;
  totalSales: number;
  totalCash: number;
  totalCard: number;
  totalOther: number;
  totalOrders: number;
  openedAt: string;
  closedAt: string | null;
  notes: string | null;
}

interface ShiftState {
  currentShift: Shift | null;
  isLoading: boolean;

  fetchCurrentShift: () => Promise<void>;
  openShift: (openingBalance: number) => Promise<Shift>;
  closeShift: (shiftId: string, cashCount: number, notes?: string) => Promise<{ shift: Shift; report: Record<string, unknown> }>;
}

export const useShiftStore = create<ShiftState>()(
  persist(
    (set, get) => ({
      currentShift: null,
      isLoading: false,

      fetchCurrentShift: async () => {
        set({ isLoading: true });
        try {
          const { data } = await api.get('/shifts', { params: { action: 'current' } });
          set({ currentShift: data.shift || null, isLoading: false });
        } catch {
          set({ isLoading: false });
        }
      },

      openShift: async (openingBalance: number) => {
        const { data } = await api.post('/shifts', { action: 'open', openingBalance });
        set({ currentShift: data.shift });
        return data.shift;
      },

      closeShift: async (shiftId: string, cashCount: number, notes?: string) => {
        const { data } = await api.post('/shifts', { action: 'close', shiftId, cashCount, notes });
        set({ currentShift: null });
        return { shift: data.shift, report: data.report };
      },
    }),
    { name: 'pos-shift', partialize: (state) => ({ currentShift: state.currentShift }) },
  ),
);
