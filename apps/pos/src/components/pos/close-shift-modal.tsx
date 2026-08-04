import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useShiftStore, type Shift } from '@/stores/shift-store';
import { useTheme } from '@/hooks/use-theme';
import { api } from '@/lib/api';
import { Lock, X, Loader2, Printer } from 'lucide-react';

interface CloseShiftModalProps {
  open: boolean;
  shift: Shift | null;
  onClose: () => void;
}

interface ShiftReport {
  totalSales: number;
  totalOrders: number;
  totalItems: number;
  paymentMethods: Record<string, number>;
  cashBalance: number | null;
}

export function CloseShiftModal({ open, shift, onClose }: CloseShiftModalProps) {
  const { c } = useTheme();
  const { closeShift } = useShiftStore();
  const [cashCount, setCashCount] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ report: Record<string, unknown> } | null>(null);
  const [error, setError] = useState('');

  const { data: reportData } = useQuery({
    queryKey: ['shift-report', shift?.id],
    queryFn: async () => {
      if (!shift) return null;
      const { data } = await api.get('/shifts', { params: { action: 'x-report', shiftId: shift.id } });
      return data.report as ShiftReport;
    },
    enabled: open && !!shift,
  });

  useEffect(() => {
    if (!open) {
      setCashCount('');
      setNotes('');
      setResult(null);
      setError('');
    }
  }, [open]);

  if (!open || !shift) return null;

  const report = reportData;
  const expectedCash = report ? (shift.openingBalance + (report.paymentMethods?.CASH || 0)) : 0;
  const actualCash = Number(cashCount) || 0;
  const difference = actualCash - expectedCash;

  const handleClose = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await closeShift(shift.id, actualCash, notes);
      setResult(res);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Ошибка';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const printReport = () => {
    const w = window.open('', '_blank', 'width=400,height=600');
    if (!w) return;
    const now = new Date().toLocaleString('ru-RU');
    w.document.write(`
      <html><head><title>X-Отчёт</title><style>
        body{font-family:monospace;padding:20px;font-size:13px;max-width:300px;margin:0 auto}
        .line{display:flex;justify-content:space-between;margin:4px 0}
        .bold{font-weight:700}.center{text-align:center}.hr{border-top:1px dashed #000;margin:8px 0}
        .green{color:green}.red{color:red}
      </style></head><body>
        <div class="center bold" style="font-size:16px">X-ОТЧЁТ</div>
        <div class="center" style="margin:4px 0">${now}</div>
        <div class="center">Кассир: ${shift.cashierId}</div>
        <div class="hr"></div>
        <div class="line"><span>Продажи:</span><span class="bold">${(report?.totalSales || 0).toLocaleString('ru-RU')} сум</span></div>
        <div class="line"><span>Заказов:</span><span>${report?.totalOrders || 0}</span></div>
        <div class="line"><span>Позиций:</span><span>${report?.totalItems || 0}</span></div>
        <div class="hr"></div>
        <div class="bold">Оплата:</div>
        ${Object.entries(report?.paymentMethods || {}).map(([m, v]) => `<div class="line"><span>${m}:</span><span>${Number(v).toLocaleString('ru-RU')} сум</span></div>`).join('')}
        <div class="hr"></div>
        <div class="line"><span>Начало смены:</span><span>${shift.openingBalance.toLocaleString('ru-RU')} сум</span></div>
        <div class="line"><span>Ожидается наличными:</span><span class="bold">${expectedCash.toLocaleString('ru-RU')} сум</span></div>
        ${cashCount ? `<div class="line"><span>Факт наличными:</span><span class="bold">${actualCash.toLocaleString('ru-RU')} сум</span></div>` : ''}
        ${cashCount ? `<div class="line"><span>${difference >= 0 ? 'Излишек:' : 'Недостача:'}</span><span class="${difference >= 0 ? 'green' : 'red'} bold">${Math.abs(difference).toLocaleString('ru-RU')} сум</span></div>` : ''}
        <div class="hr"></div>
        <div class="center" style="margin-top:16px">Спасибо за работу!</div>
      </body></html>
    `);
    w.document.close();
    w.print();
  };

  if (result) {
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)' }}>
        <div style={{ background: c.bgCard, borderRadius: 16, width: '100%', maxWidth: 420, margin: '0 16px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
          <div style={{ padding: 24, textAlign: 'center' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 56, height: 56, borderRadius: 16, background: '#DCFCE7', marginBottom: 12 }}>
              <Lock style={{ width: 28, height: 28, color: '#16A34A' }} />
            </div>
            <p style={{ fontWeight: 600, fontSize: 16, color: c.text, marginBottom: 4 }}>Смена закрыта</p>
            <div style={{ textAlign: 'left', marginTop: 16, padding: 16, background: c.bgSecondary, borderRadius: 12, fontSize: 13 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}><span style={{ color: c.textSecondary }}>Продажи:</span><span style={{ fontWeight: 600, color: c.text }}>{Number(result.report.totalSales || 0).toLocaleString('ru-RU')} сум</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}><span style={{ color: c.textSecondary }}>Заказов:</span><span style={{ color: c.text }}>{result.report.totalOrders || 0}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}><span style={{ color: c.textSecondary }}>Наличные:</span><span style={{ color: c.text }}>{Number(result.report.totalCash || 0).toLocaleString('ru-RU')} сум</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}><span style={{ color: c.textSecondary }}>Карта:</span><span style={{ color: c.text }}>{Number(result.report.totalCard || 0).toLocaleString('ru-RU')} сум</span></div>
              {result.report.difference != null && (
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: `1px solid ${c.border}`, paddingTop: 6, marginTop: 6 }}>
                  <span style={{ color: c.textSecondary }}>{Number(result.report.difference) >= 0 ? 'Излишек:' : 'Недостача:'}</span>
                  <span style={{ fontWeight: 700, color: Number(result.report.difference) >= 0 ? '#16A34A' : '#DC2626' }}>{Math.abs(Number(result.report.difference)).toLocaleString('ru-RU')} сум</span>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button onClick={printReport} style={{ flex: 1, height: 44, borderRadius: 10, border: `1px solid ${c.border}`, background: c.bgCard, color: c.text, fontSize: 14, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <Printer style={{ width: 16, height: 16 }} /> Печать
              </button>
              <button onClick={onClose} style={{ flex: 1, height: 44, borderRadius: 10, border: 'none', background: c.primary, color: '#FFFFFF', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Готово</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)' }}>
      <div style={{ background: c.bgCard, borderRadius: 16, width: '100%', maxWidth: 440, margin: '0 16px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', maxHeight: '90vh', overflow: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: `1px solid ${c.border}` }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: c.text }}>Закрытие смены (X-отчёт)</h2>
          <button onClick={onClose} style={{ padding: 4, background: 'none', border: 'none', cursor: 'pointer', borderRadius: 6, color: c.textSecondary }}><X style={{ width: 20, height: 20 }} /></button>
        </div>
        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {report && (
            <div style={{ padding: 16, background: c.bgSecondary, borderRadius: 12, fontSize: 13 }}>
              <p style={{ fontWeight: 600, fontSize: 14, color: c.text, marginBottom: 8 }}>Итоги смены</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}><span style={{ color: c.textSecondary }}>Продажи:</span><span style={{ fontWeight: 600 }}>{report.totalSales.toLocaleString('ru-RU')} сум</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}><span style={{ color: c.textSecondary }}>Заказов:</span><span>{report.totalOrders}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}><span style={{ color: c.textSecondary }}>Позиций:</span><span>{report.totalItems}</span></div>
              <div style={{ borderTop: `1px solid ${c.border}`, margin: '8px 0', paddingTop: 8 }}>
                {Object.entries(report.paymentMethods).map(([m, v]) => (
                  <div key={m} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}><span style={{ color: c.textSecondary }}>{m}:</span><span>{Number(v).toLocaleString('ru-RU')} сум</span></div>
                ))}
              </div>
              <div style={{ borderTop: `1px solid ${c.border}`, marginTop: 8, paddingTop: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: c.textSecondary }}>Начало смены:</span><span>{shift.openingBalance.toLocaleString('ru-RU')} сум</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}><span>Ожидается наличными:</span><span>{expectedCash.toLocaleString('ru-RU')} сум</span></div>
              </div>
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: c.text, marginBottom: 6 }}>Фактическая сумма наличных</label>
            <input
              type="number"
              value={cashCount}
              onChange={(e) => setCashCount(e.target.value)}
              placeholder="Введите сумму из кассы"
              style={{ width: '100%', height: 44, padding: '0 12px', borderRadius: 10, border: `1px solid ${c.border}`, fontSize: 16, boxSizing: 'border-box', outline: 'none', background: c.bgCard, color: c.text }}
            />
            {cashCount && (
              <p style={{ fontSize: 12, marginTop: 4, color: difference >= 0 ? '#16A34A' : '#DC2626', fontWeight: 500 }}>
                {difference >= 0 ? `Излишек: ${difference.toLocaleString('ru-RU')} сум` : `Недостача: ${Math.abs(difference).toLocaleString('ru-RU')} сум`}
              </p>
            )}
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: c.text, marginBottom: 6 }}>Примечание</label>
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Необязательно"
              style={{ width: '100%', height: 40, padding: '0 12px', borderRadius: 10, border: `1px solid ${c.border}`, fontSize: 14, boxSizing: 'border-box', outline: 'none', background: c.bgCard, color: c.text }}
            />
          </div>

          {error && <p style={{ fontSize: 13, color: c.danger }}>{error}</p>}

          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={printReport} style={{ height: 44, padding: '0 16px', borderRadius: 10, border: `1px solid ${c.border}`, background: c.bgCard, color: c.text, fontSize: 14, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Printer style={{ width: 16, height: 16 }} /> Печать
            </button>
            <button onClick={handleClose} disabled={loading || !cashCount} style={{ flex: 1, height: 44, borderRadius: 10, border: 'none', background: c.danger, color: '#FFFFFF', fontSize: 14, fontWeight: 600, cursor: loading || !cashCount ? 'not-allowed' : 'pointer', opacity: loading || !cashCount ? 0.5 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              {loading ? <Loader2 style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} /> : <Lock style={{ width: 16, height: 16 }} />}
              {loading ? 'Закрытие...' : 'Закрыть смену'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
