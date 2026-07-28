import { ESC_POS, centerText, formatReceiptLine } from './index';

export interface ReceiptItem {
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
  note?: string;
}

export interface ReceiptData {
  orderNumber: string;
  date: string;
  cashierName: string;
  items: ReceiptItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paymentMethod: string;
  amountPaid: number;
  change: number;
  companyName?: string;
  companyAddress?: string;
  companyPhone?: string;
}

export interface KitchenTicketData {
  orderNumber: string;
  date: string;
  items: { name: string; quantity: number; note?: string }[];
  notes?: string;
  stationName: string;
}

export function buildReceipt(data: ReceiptData, width: number = 48): Buffer {
  const buffers: Buffer[] = [];

  buffers.push(ESC_POS.INIT);
  buffers.push(ESC_POS.CENTER);

  if (data.companyName) {
    buffers.push(Buffer.from(centerText(data.companyName, width) + '\n'));
  }
  if (data.companyAddress) {
    buffers.push(Buffer.from(centerText(data.companyAddress, width) + '\n'));
  }
  if (data.companyPhone) {
    buffers.push(Buffer.from(centerText(data.companyPhone, width) + '\n'));
  }

  buffers.push(Buffer.from('─'.repeat(width) + '\n'));
  buffers.push(ESC_POS.LEFT);

  buffers.push(Buffer.from(formatReceiptLine('Заказ:', data.orderNumber, width) + '\n'));
  buffers.push(Buffer.from(formatReceiptLine('Дата:', data.date, width) + '\n'));
  buffers.push(Buffer.from(formatReceiptLine('Кассир:', data.cashierName, width) + '\n'));
  buffers.push(Buffer.from('─'.repeat(width) + '\n'));

  for (const item of data.items) {
    buffers.push(Buffer.from(`  ${item.name}\n`));
    buffers.push(Buffer.from(
      formatReceiptLine(
        `  ${item.quantity} x ${item.unitPrice.toLocaleString('ru-RU')}`,
        item.total.toLocaleString('ru-RU') + ' ₽',
        width,
      ) + '\n',
    ));
    if (item.note) {
      buffers.push(Buffer.from(`  Примечание: ${item.note}\n`));
    }
  }

  buffers.push(Buffer.from('─'.repeat(width) + '\n'));

  buffers.push(ESC_POS.BOLD_ON);
  buffers.push(Buffer.from(formatReceiptLine('  Подытог:', data.subtotal.toLocaleString('ru-RU') + ' ₽', width) + '\n'));
  buffers.push(ESC_POS.BOLD_OFF);

  if (data.discount > 0) {
    buffers.push(Buffer.from(formatReceiptLine('  Скидка:', '-' + data.discount.toLocaleString('ru-RU') + ' ₽', width) + '\n'));
  }

  if (data.tax > 0) {
    buffers.push(Buffer.from(formatReceiptLine('  НДС:', data.tax.toLocaleString('ru-RU') + ' ₽', width) + '\n'));
  }

  buffers.push(ESC_POS.BOLD_ON);
  buffers.push(Buffer.from(formatReceiptLine('  ИТОГО:', data.total.toLocaleString('ru-RU') + ' ₽', width) + '\n'));
  buffers.push(ESC_POS.BOLD_OFF);

  buffers.push(Buffer.from('─'.repeat(width) + '\n'));
  buffers.push(Buffer.from(formatReceiptLine('  Оплата:', data.paymentMethod, width) + '\n'));
  buffers.push(Buffer.from(formatReceiptLine('  Внесено:', data.amountPaid.toLocaleString('ru-RU') + ' ₽', width) + '\n'));

  if (data.change > 0) {
    buffers.push(Buffer.from(formatReceiptLine('  Сдача:', data.change.toLocaleString('ru-RU') + ' ₽', width) + '\n'));
  }

  buffers.push(Buffer.from('─'.repeat(width) + '\n'));
  buffers.push(ESC_POS.CENTER);
  buffers.push(Buffer.from(centerText('Спасибо за покупку!', width) + '\n'));
  buffers.push(Buffer.from(centerText('Добро пожаловать снова!', width) + '\n'));
  buffers.push(ESC_POS.LEFT);
  buffers.push(ESC_POS.FEED);
  buffers.push(ESC_POS.PARTIAL_CUT);

  return Buffer.concat(buffers);
}

export function buildKitchenTicket(data: KitchenTicketData, width: number = 48): Buffer {
  const buffers: Buffer[] = [];

  buffers.push(ESC_POS.INIT);
  buffers.push(ESC_POS.CENTER);
  buffers.push(ESC_POS.BOLD_ON);
  buffers.push(Buffer.from(centerText('=== КУХНЯ ===', width) + '\n'));
  buffers.push(ESC_POS.BOLD_OFF);
  buffers.push(ESC_POS.LEFT);
  buffers.push(Buffer.from('─'.repeat(width) + '\n'));

  buffers.push(Buffer.from(formatReceiptLine('Заказ:', data.orderNumber, width) + '\n'));
  buffers.push(Buffer.from(formatReceiptLine('Станция:', data.stationName, width) + '\n'));
  buffers.push(Buffer.from(formatReceiptLine('Дата:', data.date, width) + '\n'));
  buffers.push(Buffer.from('─'.repeat(width) + '\n'));

  buffers.push(ESC_POS.BOLD_ON);
  buffers.push(Buffer.from('  ПОЗИЦИИ:\n'));
  buffers.push(ESC_POS.BOLD_OFF);

  for (const item of data.items) {
    buffers.push(ESC_POS.BOLD_ON);
    buffers.push(Buffer.from(`  ${item.quantity}x ${item.name}\n`));
    buffers.push(ESC_POS.BOLD_OFF);
    if (item.note) {
      buffers.push(Buffer.from(`  * ${item.note}\n`));
    }
  }

  if (data.notes) {
    buffers.push(Buffer.from('─'.repeat(width) + '\n'));
    buffers.push(Buffer.from(`  Примечание: ${data.notes}\n`));
  }

  buffers.push(Buffer.from('─'.repeat(width) + '\n'));
  buffers.push(ESC_POS.FEED);
  buffers.push(ESC_POS.PARTIAL_CUT);

  return Buffer.concat(buffers);
}

export function buildXReport(data: {
  from: string;
  to: string;
  totalSales: number;
  totalOrders: number;
  cashTotal: number;
  cardTotal: number;
  otherTotal: number;
}, width: number = 48): Buffer {
  const buffers: Buffer[] = [];

  buffers.push(ESC_POS.INIT);
  buffers.push(ESC_POS.CENTER);
  buffers.push(ESC_POS.BOLD_ON);
  buffers.push(Buffer.from(centerText('X-ОТЧЁТ', width) + '\n'));
  buffers.push(ESC_POS.BOLD_OFF);
  buffers.push(ESC_POS.LEFT);
  buffers.push(Buffer.from('─'.repeat(width) + '\n'));

  buffers.push(Buffer.from(formatReceiptLine('  Период:', `${data.from} - ${data.to}`, width) + '\n'));
  buffers.push(Buffer.from('─'.repeat(width) + '\n'));

  buffers.push(ESC_POS.BOLD_ON);
  buffers.push(Buffer.from(formatReceiptLine('  Продажи:', data.totalSales.toLocaleString('ru-RU') + ' ₽', width) + '\n'));
  buffers.push(ESC_POS.BOLD_OFF);
  buffers.push(Buffer.from(formatReceiptLine('  Заказов:', String(data.totalOrders), width) + '\n'));
  buffers.push(Buffer.from('─'.repeat(width) + '\n'));
  buffers.push(Buffer.from(formatReceiptLine('  Наличные:', data.cashTotal.toLocaleString('ru-RU') + ' ₽', width) + '\n'));
  buffers.push(Buffer.from(formatReceiptLine('  Карта:', data.cardTotal.toLocaleString('ru-RU') + ' ₽', width) + '\n'));
  buffers.push(Buffer.from(formatReceiptLine('  Другое:', data.otherTotal.toLocaleString('ru-RU') + ' ₽', width) + '\n'));
  buffers.push(Buffer.from('─'.repeat(width) + '\n'));

  buffers.push(ESC_POS.CENTER);
  buffers.push(Buffer.from(centerText(new Date().toLocaleString('ru-RU'), width) + '\n'));
  buffers.push(ESC_POS.LEFT);
  buffers.push(ESC_POS.FEED);
  buffers.push(ESC_POS.PARTIAL_CUT);

  return Buffer.concat(buffers);
}
