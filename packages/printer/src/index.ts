export interface PrintTemplate {
  id: string;
  name: string;
  type: string;
  width: number;
  content: string;
}

export interface PrintJob {
  id: string;
  printerId: string;
  type: string;
  data: Record<string, unknown>;
  status: 'PENDING' | 'PRINTING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  attempts: number;
  maxAttempts: number;
  lastError: string | null;
  createdAt: Date;
  printedAt: Date | null;
}

export interface PrinterConfig {
  id: string;
  name: string;
  type: 'usb' | 'lan' | 'bluetooth';
  ipAddress?: string;
  port?: number;
  devicePath?: string;
  paperWidth: 58 | 80;
  department: string;
}

export const ESC_POS = {
  INIT: Buffer.from([0x1b, 0x40]),
  FEED: Buffer.from([0x1b, 0x64, 3]),
  CUT: Buffer.from([0x1d, 0x56, 0x42, 0x00]),
  PARTIAL_CUT: Buffer.from([0x1d, 0x56, 0x41, 0x00]),
  BOLD_ON: Buffer.from([0x1b, 0x45, 0x01]),
  BOLD_OFF: Buffer.from([0x1b, 0x45, 0x00]),
  CENTER: Buffer.from([0x1b, 0x61, 0x01]),
  LEFT: Buffer.from([0x1b, 0x61, 0x00]),
  RIGHT: Buffer.from([0x1b, 0x61, 0x02]),
  OPEN_CASH_DRAWER: Buffer.from([0x1b, 0x70, 0x00, 0x19, 0x78]),
} as const;

export function centerText(text: string, width: number): string {
  const padding = Math.max(0, Math.floor((width - text.length) / 2));
  return ' '.repeat(padding) + text;
}

export function padText(left: string, right: string, width: number): string {
  const dots = width - left.length - right.length;
  if (dots <= 0) return left.slice(0, width - right.length) + right;
  return left + '.'.repeat(dots) + right;
}

export function formatReceiptLine(left: string, right: string, width: number = 48): string {
  const totalDots = width - left.length - right.length;
  if (totalDots <= 1) return left + ' ' + right;
  return left + ' '.repeat(totalDots) + right;
}

export function buildReceiptHeader(lines: string[], _width: number = 48): Buffer {
  const buffers: Buffer[] = [];
  buffers.push(ESC_POS.INIT);
  buffers.push(ESC_POS.CENTER);
  for (const line of lines) {
    buffers.push(Buffer.from(line + '\n'));
  }
  buffers.push(ESC_POS.LEFT);
  return Buffer.concat(buffers);
}

export function buildReceiptFooter(_width: number = 48): Buffer {
  const buffers: Buffer[] = [];
  buffers.push(ESC_POS.FEED);
  buffers.push(ESC_POS.CENTER);
  buffers.push(Buffer.from('Thank you!\n'));
  buffers.push(ESC_POS.LEFT);
  buffers.push(ESC_POS.FEED);
  buffers.push(ESC_POS.PARTIAL_CUT);
  return Buffer.concat(buffers);
}

export { buildReceipt, buildKitchenTicket, buildXReport } from './receipt';
export type { ReceiptData, ReceiptItem, KitchenTicketData } from './receipt';
export { PrintQueue, printQueue } from './queue';
export type { PrintJobData, PrintHandler } from './queue';
