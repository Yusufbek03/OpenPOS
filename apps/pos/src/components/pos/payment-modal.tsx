import { useState, useRef } from 'react';
import { X, Banknote, CreditCard, Smartphone, Printer, CheckCircle, AlertCircle, Plus, Minus } from 'lucide-react';
import { useCartStore } from '@/stores/cart-store';
import { useCreateOrder, useProcessPayment } from '@/hooks/use-order';

interface PaymentModalProps {
  open: boolean;
  onClose: () => void;
  onCompleted: () => void;
}

const PAYMENT_METHODS = [
  { id: 'CASH', label: 'Наличные', icon: Banknote, bg: '#DCFCE7', fg: '#16A34A' },
  { id: 'CARD', label: 'Карта', icon: CreditCard, bg: '#DBEAFE', fg: '#2563EB' },
  { id: 'CLICK', label: 'Click', icon: Smartphone, bg: '#F3E8FF', fg: '#8B5CF6' },
  { id: 'PAYME', label: 'Payme', icon: Smartphone, bg: '#CFFAFE', fg: '#0891B2' },
];

const METHOD_LABELS: Record<string, string> = { CASH: 'Наличные', CARD: 'Карта', CLICK: 'Click', PAYME: 'Payme' };

interface ReceiptItem { name: string; quantity: number; unitPrice: number; total: number; }
interface ReceiptData {
  orderId: string; items: ReceiptItem[]; subtotal: number; discount: number;
  total: number; payments: { method: string; amount: number }[]; paidAmount: number; change: number; date: string;
}

export function PaymentModal({ open, onClose, onCompleted }: PaymentModalProps) {
  const items = useCartStore((s) => s.items);
  const getTotal = useCartStore((s) => s.getTotal);
  const getSubtotal = useCartStore((s) => s.getSubtotal);
  const clearCart = useCartStore((s) => s.clearCart);
  const customerId = useCartStore((s) => s.customerId);
  const tableId = useCartStore((s) => s.tableId);
  const notes = useCartStore((s) => s.notes);
  const getOrderDiscountAmount = useCartStore((s) => s.getOrderDiscountAmount);

  const [step, setStep] = useState<'method' | 'processing' | 'complete'>('method');
  const [payments, setPayments] = useState<{ method: string; amount: number }[]>([{ method: 'CASH', amount: 0 }]);
  const [printStatus, setPrintStatus] = useState<'none' | 'printing' | 'success' | 'failed' | 'no-printer'>('none');
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);
  const [error, setError] = useState('');

  const createOrder = useCreateOrder();
  const processPayment = useProcessPayment();
  const receiptRef = useRef<HTMLDivElement>(null);

  const total = getTotal();
  const totalPaid = payments.reduce((s, p) => s + p.amount, 0);
  const remaining = Math.max(0, total - totalPaid);
  const change = totalPaid > total ? totalPaid - total : 0;

  const tryPrintReceipt = async (_orderId: string) => {
    setPrintStatus('printing');
    try {
      const printContent = receiptRef.current;
      if (!printContent) { setPrintStatus('failed'); return; }

      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.left = '-9999px';
      iframe.style.top = '-9999px';
      iframe.style.width = '80mm';
      document.body.appendChild(iframe);

      const doc = iframe.contentWindow?.document;
      if (!doc) { setPrintStatus('failed'); return; }

      doc.open();
      doc.write(`
        <html><head><title>Чек</title>
        <style>
          @page { size: 80mm auto; margin: 2mm; }
          body { font-family: 'Courier New', monospace; font-size: 12px; margin: 0; padding: 4mm; width: 72mm; }
          * { margin: 0; padding: 0; box-sizing: border-box; }
        </style></head><body>${printContent.innerHTML}</body></html>
      `);
      doc.close();

      iframe.contentWindow?.focus();
      setTimeout(() => {
        try {
          iframe.contentWindow?.print();
        } catch {}
        setTimeout(() => { document.body.removeChild(iframe); setPrintStatus('success'); }, 500);
      }, 300);
    } catch { setPrintStatus('failed'); }
  };

  const updatePayment = (index: number, method: string) => {
    const next = [...payments];
    const existing = next[index];
    if (existing) {
      next[index] = { ...existing, method };
      setPayments(next);
    }
  };

  const updatePaymentAmount = (index: number, amount: number) => {
    const next = [...payments];
    const existing = next[index];
    if (existing) {
      next[index] = { ...existing, amount };
      setPayments(next);
    }
  };

  const addPayment = () => {
    const usedMethods = payments.map((p) => p.method);
    const nextMethod = PAYMENT_METHODS.find((pm) => !usedMethods.includes(pm.id))?.id || 'CASH';
    setPayments([...payments, { method: nextMethod, amount: remaining }]);
  };

  const removePayment = (index: number) => {
    if (payments.length <= 1) return;
    setPayments(payments.filter((_, i) => i !== index));
  };

  const handlePay = async () => {
    if (items.length === 0 || totalPaid < total) return;
    setStep('processing');
    setPrintStatus('none');
    setError('');

    try {
      const receiptItems: ReceiptItem[] = items.map((i) => ({ name: i.product?.nameRu || 'Товар', quantity: i.quantity, unitPrice: i.unitPrice, total: i.total }));
      const subtotal = getSubtotal();
      const currentTotal = getTotal();

      const order = await createOrder.mutateAsync({
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity, unitPrice: i.unitPrice, discount: i.discount, note: i.note || undefined })),
        customerId: customerId ?? undefined,
        tableId: tableId ?? undefined,
        notes: notes || undefined,
        discount: getOrderDiscountAmount(),
      });

      for (const p of payments.filter((p) => p.amount > 0)) {
        await processPayment.mutateAsync({ orderId: order.id, method: p.method, amount: p.amount });
      }

      setReceipt({
        orderId: order.id, items: receiptItems, subtotal, discount: getOrderDiscountAmount(),
        total: currentTotal, payments: payments.filter((p) => p.amount > 0).map((p) => ({ method: p.method, amount: p.amount })),
        paidAmount: totalPaid, change, date: new Date().toLocaleString('uz-UZ'),
      });

      clearCart();
      setStep('complete');
      tryPrintReceipt(order.id);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Ошибка при оплате');
      setStep('method');
    }
  };

  const handleClose = () => { onClose(); setStep('method'); setPayments([{ method: 'CASH', amount: 0 }]); setPrintStatus('none'); setReceipt(null); onCompleted(); };

  if (!open) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)' }}>
      <div style={{ background: '#FFFFFF', borderRadius: 16, width: '100%', maxWidth: 520, margin: '0 16px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', overflow: 'hidden', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid #E5E7EB', flexShrink: 0 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600 }}>{step === 'complete' ? 'Чек' : 'Оплата'}</h2>
          <button onClick={step === 'complete' ? handleClose : onClose} style={{ padding: 6, borderRadius: 8, background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}><X style={{ width: 20, height: 20 }} /></button>
        </div>

        {step === 'method' && (
          <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto' }}>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 32, fontWeight: 700, color: '#2563EB' }}>{total.toLocaleString('uz-UZ')} сўм</p>
              <p style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>{items.length} товаров</p>
            </div>

            {payments.map((p, idx) => (
              <div key={idx} style={{ background: '#F9FAFB', borderRadius: 12, padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 12, fontWeight: 500, color: '#6B7280' }}>Оплата {payments.length > 1 ? `#${idx + 1}` : ''}</span>
                  {payments.length > 1 && (
                    <button onClick={() => removePayment(idx)} style={{ padding: 4, background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444' }}><Minus style={{ width: 14, height: 14 }} /></button>
                  )}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 6 }}>
                  {PAYMENT_METHODS.map((pm) => (
                    <button key={pm.id} onClick={() => updatePayment(idx, pm.id)}
                      style={{ padding: '8px 4px', borderRadius: 8, border: `2px solid ${p.method === pm.id ? '#2563EB' : '#E5E7EB'}`, background: p.method === pm.id ? '#EFF6FF' : '#FFFFFF', cursor: 'pointer', fontSize: 11, fontWeight: 500, textAlign: 'center' }}>
                      {pm.label}
                    </button>
                  ))}
                </div>

                {p.method === 'CASH' && (
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    <button onClick={() => updatePaymentAmount(idx, total)}
                      style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #22C55E', background: '#DCFCE7', cursor: 'pointer', fontSize: 11, fontWeight: 500, color: '#16A34A' }}>
                      Точная сумма
                    </button>
                  </div>
                )}

                <input type="number" value={p.amount || ''} onChange={(e) => updatePaymentAmount(idx, Number(e.target.value))}
                  placeholder={`Из ${total.toLocaleString('uz-UZ')}`}
                  style={{ width: '100%', height: 44, padding: '0 12px', borderRadius: 10, border: '1px solid #E5E7EB', fontSize: 16, fontWeight: 600, textAlign: 'center', outline: 'none', boxSizing: 'border-box' }} />
              </div>
            ))}

            {remaining > 0 && payments.length < PAYMENT_METHODS.length && (
              <button onClick={addPayment}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px 0', borderRadius: 10, border: '2px dashed #E5E7EB', background: 'transparent', cursor: 'pointer', color: '#6B7280', fontSize: 13, fontWeight: 500 }}>
                <Plus style={{ width: 16, height: 16 }} /> Разделить оплату
              </button>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '10px 12px', background: remaining > 0 ? '#FEF3C7' : '#DCFCE7', borderRadius: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: '#6B7280' }}>Оплачено</span>
                <span style={{ fontWeight: 500 }}>{totalPaid.toLocaleString('uz-UZ')} сўм</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: '#6B7280' }}>Осталось</span>
                <span style={{ fontWeight: 500, color: remaining > 0 ? '#B45309' : '#16A34A' }}>{remaining.toLocaleString('uz-UZ')} сўм</span>
              </div>
              {change > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 15, padding: '8px 0', borderTop: '1px dashed #86efac', marginTop: 4 }}>
                  <span style={{ fontWeight: 600, color: '#16A34A' }}>Сдача</span>
                  <span style={{ fontWeight: 700, fontSize: 20, color: '#16A34A' }}>{change.toLocaleString('uz-UZ')} сўм</span>
                </div>
              )}
            </div>

            {error && <div style={{ background: '#FEF2F2', color: '#DC2626', fontSize: 13, textAlign: 'center', borderRadius: 8, padding: '10px 14px' }}>{error}</div>}

            <button onClick={handlePay} disabled={totalPaid < total || createOrder.isPending || processPayment.isPending}
              style={{ width: '100%', height: 56, borderRadius: 14, border: 'none', cursor: totalPaid < total ? 'not-allowed' : 'pointer', background: '#22C55E', color: '#FFFFFF', fontWeight: 700, fontSize: 18, opacity: totalPaid < total ? 0.5 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, boxShadow: '0 4px 14px rgba(34,197,94,0.3)', flexShrink: 0 }}>
              {(createOrder.isPending || processPayment.isPending) ? (<><span style={{ width: 20, height: 20, border: '2px solid #FFFFFF', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.6s linear infinite', display: 'inline-block' }} />Обработка...</>) : 'Подтвердить оплату'}
            </button>
          </div>
        )}

        {step === 'processing' && (
          <div style={{ padding: '48px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 48, height: 48, border: '4px solid #2563EB', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
            <p style={{ color: '#6B7280' }}>Обработка оплаты...</p>
          </div>
        )}

        {step === 'complete' && receipt && (
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
            <div ref={receiptRef} style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 0 }}>
              <div style={{ textAlign: 'center', paddingBottom: 16, borderBottom: '1px dashed #D1D5DB' }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: '#22C55E', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                  <CheckCircle style={{ width: 28, height: 28, color: '#FFFFFF' }} />
                </div>
                <p style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>Оплата прошла успешно!</p>
                <p style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>{receipt.date}</p>
                <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>Заказ #{receipt.orderId.slice(0, 8).toUpperCase()}</p>
              </div>

              <div style={{ padding: '12px 0', borderBottom: '1px dashed #D1D5DB', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {receipt.items.map((item, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <div style={{ flex: 1 }}><span style={{ color: '#111827', fontWeight: 500 }}>{item.name}</span><span style={{ color: '#6B7280' }}> × {item.quantity}</span></div>
                    <span style={{ fontWeight: 500, color: '#111827' }}>{item.total.toLocaleString('uz-UZ')} сўм</span>
                  </div>
                ))}
              </div>

              <div style={{ padding: '12px 0', display: 'flex', flexDirection: 'column', gap: 6, borderBottom: '1px dashed #D1D5DB' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#6B7280' }}><span>Товары ({receipt.items.length})</span><span>{receipt.subtotal.toLocaleString('uz-UZ')} сўм</span></div>
                {receipt.discount > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#EF4444' }}><span>Скидка</span><span>-{receipt.discount.toLocaleString('uz-UZ')} сўм</span></div>}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 700, color: '#111827', paddingTop: 6 }}><span>Итого</span><span style={{ color: '#2563EB' }}>{receipt.total.toLocaleString('uz-UZ')} сўм</span></div>
              </div>

              <div style={{ padding: '12px 0', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {receipt.payments.map((p, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span style={{ color: '#6B7280' }}>{METHOD_LABELS[p.method] || p.method}</span>
                    <span style={{ fontWeight: 500 }}>{p.amount.toLocaleString('uz-UZ')} сўм</span>
                  </div>
                ))}
                {receipt.change > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}><span style={{ color: '#6B7280' }}>Сдача</span><span style={{ fontWeight: 500, color: '#22C55E' }}>{receipt.change.toLocaleString('uz-UZ')} сўм</span></div>}
              </div>
            </div>

            <div style={{ padding: '0 20px 8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 12, color: printStatus === 'success' ? '#22C55E' : printStatus === 'failed' ? '#EF4444' : '#6B7280' }}>
              {printStatus === 'printing' && <><Printer style={{ width: 14, height: 14 }} /> Печать чека...</>}
              {printStatus === 'success' && <><CheckCircle style={{ width: 14, height: 14 }} /> Чек напечатан</>}
              {printStatus === 'failed' && <><AlertCircle style={{ width: 14, height: 14 }} /> Ошибка печати</>}
              {printStatus === 'no-printer' && <><Printer style={{ width: 14, height: 14 }} /> Принтер не настроен</>}
            </div>

            <div style={{ padding: '12px 20px 20px', flexShrink: 0 }}>
              <button onClick={handleClose} style={{ width: '100%', height: 48, borderRadius: 12, border: 'none', cursor: 'pointer', background: '#2563EB', color: '#FFFFFF', fontWeight: 600, fontSize: 15 }}>Готово</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
