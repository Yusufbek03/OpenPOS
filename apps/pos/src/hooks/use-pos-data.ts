import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { offlineStorage } from '@/lib/offline-storage';
import type { Product, Category } from '@/types';

export function useProducts(params?: { categoryId?: string; search?: string }) {
  return useQuery({
    queryKey: ['products', params],
    queryFn: async () => {
      try {
        const { data } = await api.get('/products', { params: { ...params, limit: 200 } });
        const products = (data.items || data.products || data) as Product[];
        await offlineStorage.products.save(products);
        return products;
      } catch {
        return offlineStorage.products.getAll() as Promise<Product[]>;
      }
    },
  });
}

export function useProductSearch(query: string) {
  return useQuery({
    queryKey: ['products', 'search', query],
    queryFn: async () => {
      try {
        const { data } = await api.get('/products/search', { params: { q: query } });
        return data as Product[];
      } catch {
        const all = await offlineStorage.products.getAll() as Product[];
        const q = query.toLowerCase();
        return all.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            p.nameRu.toLowerCase().includes(q) ||
            p.sku.toLowerCase().includes(q) ||
            (p.barcode && p.barcode.includes(q)),
        );
      }
    },
    enabled: query.length >= 2,
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      try {
      const { data } = await api.get('/categories', { params: { limit: 100 } });
      const categories = (data.categories || data) as Category[];
        await offlineStorage.categories.save(categories);
        return categories;
      } catch {
        return offlineStorage.categories.getAll() as Promise<Category[]>;
      }
    },
  });
}

export function useCustomers(search?: string) {
  return useQuery({
    queryKey: ['customers', search],
    queryFn: async () => {
      const { data } = await api.get('/customers', { params: { search, limit: 50 } });
      return data.customers;
    },
    enabled: search !== undefined,
  });
}
