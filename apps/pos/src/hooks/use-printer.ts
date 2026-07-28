import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function usePrintReceipt() {
  return useMutation({
    mutationFn: async ({ orderId, printerId }: { orderId: string; printerId: string }) => {
      const { data } = await api.post('/printers/print-receipt', { orderId, printerId });
      return data;
    },
  });
}

export function useTestPrinter() {
  return useMutation({
    mutationFn: async (printerId: string) => {
      const { data } = await api.post(`/printers/${printerId}/test`);
      return data;
    },
  });
}

export function usePrinters(department?: string) {
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.get('/printers', { params: { department } });
      return data;
    },
  });
}
