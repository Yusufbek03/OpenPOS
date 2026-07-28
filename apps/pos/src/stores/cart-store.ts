import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Product, CartItem, Customer } from '@/types';

interface CartState {
  items: CartItem[];
  customerId: string | null;
  customer: Customer | null;
  tableId: string | null;
  notes: string;
  orderDiscount: number;
  orderDiscountType: 'fixed' | 'percent';

  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  updateItemNote: (productId: string, note: string) => void;
  setItemDiscount: (productId: string, discount: number) => void;
  setOrderDiscount: (discount: number, type: 'fixed' | 'percent') => void;
  clearCart: () => void;
  setCustomer: (customer: Customer | null) => void;
  setTableId: (tableId: string | null) => void;
  setNotes: (notes: string) => void;
  getSubtotal: () => number;
  getItemDiscounts: () => number;
  getOrderDiscountAmount: () => number;
  getTax: () => number;
  getTotal: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      customerId: null,
      customer: null,
      tableId: null,
      notes: '',
      orderDiscount: 0,
      orderDiscountType: 'fixed',

      addItem: (product, quantity = 1) => {
        const { items } = get();
        const existing = items.find((i) => i.productId === product.id);
        const price = Number(product.price);

        if (existing) {
          set({
            items: items.map((i) =>
              i.productId === product.id
                ? { ...i, quantity: i.quantity + quantity, total: (i.quantity + quantity) * price - i.discount }
                : i,
            ),
          });
        } else {
          set({
            items: [
              ...items,
              {
                productId: product.id,
                product,
                quantity,
                unitPrice: price,
                discount: 0,
                total: quantity * price,
                note: '',
              },
            ],
          });
        }
      },

      removeItem: (productId) => {
        set({ items: get().items.filter((i) => i.productId !== productId) });
      },

      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }
        set({
          items: get().items.map((i) =>
            i.productId === productId
              ? { ...i, quantity, total: quantity * i.unitPrice - i.discount }
              : i,
          ),
        });
      },

      updateItemNote: (productId, note) => {
        set({
          items: get().items.map((i) => (i.productId === productId ? { ...i, note } : i)),
        });
      },

      setItemDiscount: (productId, discount) => {
        set({
          items: get().items.map((i) =>
            i.productId === productId
              ? { ...i, discount, total: i.quantity * i.unitPrice - discount }
              : i,
          ),
        });
      },

      setOrderDiscount: (discount, type) => set({ orderDiscount: discount, orderDiscountType: type }),

      clearCart: () => set({ items: [], customerId: null, customer: null, tableId: null, notes: '', orderDiscount: 0, orderDiscountType: 'fixed' }),

      setCustomer: (customer) => set({ customerId: customer?.id ?? null, customer }),

      setTableId: (tableId) => set({ tableId }),

      setNotes: (notes) => set({ notes }),

      getSubtotal: () => get().items.reduce((sum, i) => sum + i.total, 0),

      getItemDiscounts: () => get().items.reduce((sum, i) => sum + i.discount, 0),

      getOrderDiscountAmount: () => {
        const { orderDiscount, orderDiscountType } = get();
        if (orderDiscountType === 'percent') {
          return get().getSubtotal() * (orderDiscount / 100);
        }
        return orderDiscount;
      },

      getTax: () => {
        const subtotal = get().getSubtotal();
        const orderDiscount = get().getOrderDiscountAmount();
        const taxable = Math.max(0, subtotal - orderDiscount);
        return get().items.reduce((sum, i) => {
          const taxRate = Number(i.product.taxRate) / 100;
          const itemShare = subtotal > 0 ? i.total / subtotal : 0;
          return sum + taxable * itemShare * taxRate;
        }, 0);
      },

      getTotal: () => {
        const subtotal = get().getSubtotal();
        const orderDiscount = get().getOrderDiscountAmount();
        return Math.max(0, subtotal - orderDiscount) + get().getTax();
      },

      getItemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    { name: 'pos-cart' },
  ),
);
