import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem } from '@/types';

export interface RemovedItem {
  id: string;
  item: CartItem;
  removedBy: string;
  removedByName: string;
  reason: string;
  removedAt: string;
}

interface RemovedItemsState {
  items: RemovedItem[];
  addItem: (item: CartItem, userId: string, userName: string, reason?: string) => void;
  getItems: () => RemovedItem[];
  clearItems: () => void;
}

export const useRemovedItemsStore = create<RemovedItemsState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item, userId, userName, reason = '') => {
        const removed: RemovedItem = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          item,
          removedBy: userId,
          removedByName: userName,
          reason,
          removedAt: new Date().toISOString(),
        };
        set({ items: [removed, ...get().items] });
      },

      getItems: () => get().items,

      clearItems: () => set({ items: [] }),
    }),
    { name: 'pos-removed-items' },
  ),
);
