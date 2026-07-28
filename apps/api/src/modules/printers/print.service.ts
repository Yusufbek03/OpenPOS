import { Injectable, Logger } from '@nestjs/common';
import { prisma } from '@openpos/database';

const ESC = {
  INIT: Buffer.from([0x1b, 0x40]),
  FEED: Buffer.from([0x1b, 0x64, 3]),
  CUT: Buffer.from([0x1d, 0x56, 0x42, 0x00]),
  PARTIAL_CUT: Buffer.from([0x1d, 0x56, 0x41, 0x00]),
  BOLD_ON: Buffer.from([0x1b, 0x45, 0x01]),
  BOLD_OFF: Buffer.from([0x1b, 0x45, 0x00]),
  CENTER: Buffer.from([0x1b, 0x61, 0x01]),
  LEFT: Buffer.from([0x1b, 0x61, 0x00]),
  RIGHT: Buffer.from([0x1b, 0x61, 0x02]),
  OPEN_CASH: Buffer.from([0x1b, 0x70, 0x00, 0x19, 0x78]),
};

function centerText(text: string, width: number): string {
  if (text.length >= width) return text;
  const pad = Math.floor((width - text.length) / 2);
  return ' '.repeat(pad) + text;
}

function padLine(left: string, right: string, width: number): string {
  const dots = width - left.length - right.length;
  if (dots <= 0) return left + right;
  return left + ' '.repeat(Math.max(1, dots)) + right;
}

@Injectable()
export class PrintService {
  private readonly logger = new Logger(PrintService.name);

  async printReceipt(orderId: string, printerId: string): Promise<boolean> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: { include: { product: true } },
        payments: true,
        cashier: true,
        branch: { include: { company: true } },
      },
    });
    if (!order) throw new Error('Order not found');

    const printer = await prisma.printer.findUnique({ where: { id: printerId } });
    if (!printer) throw new Error('Printer not found');

    const width = printer.paperWidth === 58 ? 32 : 48;
    const lines: string[] = [];

    // Header
    const company = order.branch?.company;
    if (company?.name) lines.push(centerText(company.name, width));
    if (company?.address) lines.push(centerText(company.address, width));
    if (company?.phone) lines.push(centerText(company.phone, width));
    lines.push('─'.repeat(width));

    // Order info
    lines.push(`Заказ: ${order.orderNumber}`);
    lines.push(`Дата: ${new Date(order.createdAt).toLocaleString('ru-RU')}`);
    lines.push(`Кассир: ${order.cashier?.fullName || '—'}`);
    lines.push('─'.repeat(width));

    // Items
    for (const item of order.items) {
      const name = item.product.nameRu || item.product.name;
      lines.push(name);
      lines.push(padLine(
        `  ${item.quantity} x ${Number(item.unitPrice).toLocaleString('ru-RU')}`,
        `${Number(item.total).toLocaleString('ru-RU')} ₽`,
        width,
      ));
      if (item.note) lines.push(`  * ${item.note}`);
    }

    lines.push('─'.repeat(width));

    // Totals
    lines.push(padLine('Подытог:', `${Number(order.subtotal).toLocaleString('ru-RU')} ₽`, width));
    if (Number(order.discount) > 0) {
      lines.push(padLine('Скидка:', `-${Number(order.discount).toLocaleString('ru-RU')} ₽`, width));
    }
    if (Number(order.tax) > 0) {
      lines.push(padLine('НДС:', `${Number(order.tax).toLocaleString('ru-RU')} ₽`, width));
    }
    lines.push(padLine('ИТОГО:', `${Number(order.total).toLocaleString('ru-RU')} ₽`, width));
    lines.push('─'.repeat(width));

    // Payment
    for (const p of order.payments) {
      const methodLabels: Record<string, string> = { CASH: 'Наличные', CARD: 'Карта', CLICK: 'Click', PAYME: 'Payme' };
      const methodLabel = methodLabels[p.method] || p.method;
      lines.push(padLine(`Оплата (${methodLabel}):`, `${Number(p.amount).toLocaleString('ru-RU')} ₽`, width));
    }

    // Footer
    lines.push('');
    lines.push(centerText('Спасибо за покупку!', width));
    lines.push(centerText('Добро пожаловать снова!', width));

    // Build ESC/POS buffer
    const receiptText = lines.join('\n');
    const buf = Buffer.concat([
      ESC.INIT,
      Buffer.from(receiptText, 'utf-8'),
      Buffer.from('\n\n', 'utf-8'),
      Buffer.from('\n', 'utf-8'),
      ESC.PARTIAL_CUT,
    ]);

    // Create print job in DB
    const job = await prisma.printJob.create({
      data: {
        printerId,
        type: 'RECEIPT',
        data: { orderId, orderNumber: order.orderNumber } as never,
        status: 'PENDING',
      },
    });

    this.logger.log(`Print job ${job.id} created for order ${order.orderNumber}`);

    // Try to print via TCP
    try {
      const { TcpPrinterService } = await import('./tcp-printer.service');
      const tcp = new TcpPrinterService();
      const success = await tcp.print(buf, {
        host: printer.ipAddress || 'localhost',
        port: printer.port || 9100,
      });

      await prisma.printJob.update({
        where: { id: job.id },
        data: {
          status: success ? 'COMPLETED' : 'FAILED',
          printedAt: success ? new Date() : null,
          lastError: success ? null : 'Connection failed',
        },
      });

      return success;
    } catch (err) {
      this.logger.error(`Print failed: ${err}`);
      await prisma.printJob.update({
        where: { id: job.id },
        data: { status: 'FAILED', lastError: String(err) },
      });
      return false;
    }
  }

  async printKitchenTicket(orderId: string, stationId: string, printerId?: string): Promise<boolean> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: { include: { product: true } },
      },
    });
    if (!order) throw new Error('Order not found');

    let printer;
    if (printerId) {
      printer = await prisma.printer.findUnique({ where: { id: printerId } });
    } else {
      const station = await prisma.kitchenStation.findUnique({ where: { id: stationId } });
      if (station?.printerId) {
        printer = await prisma.printer.findUnique({ where: { id: station.printerId } });
      }
    }

    if (!printer) {
      this.logger.warn(`No printer found for station ${stationId}`);
      return false;
    }

    const width = printer.paperWidth === 58 ? 32 : 48;
    const station = await prisma.kitchenStation.findUnique({ where: { id: stationId } });
    const lines: string[] = [];

    lines.push(centerText('=== КУХНЯ ===', width));
    lines.push(`Заказ: ${order.orderNumber}`);
    if (station) lines.push(`Станция: ${station.name}`);
    lines.push(`Время: ${new Date().toLocaleTimeString('ru-RU')}`);
    lines.push('─'.repeat(width));

    for (const item of order.items) {
      const name = item.product.nameRu || item.product.name;
      lines.push(`${item.quantity} x ${name}`);
      if (item.note) lines.push(`  * ${item.note}`);
    }

    if (order.notes) {
      lines.push('─'.repeat(width));
      lines.push(`📝 ${order.notes}`);
    }

    const ticketText = lines.join('\n');
    const buf = Buffer.concat([
      ESC.INIT,
      Buffer.from(ticketText, 'utf-8'),
      Buffer.from('\n\n', 'utf-8'),
      Buffer.from('\n', 'utf-8'),
      ESC.PARTIAL_CUT,
    ]);

    const job = await prisma.printJob.create({
      data: {
        printerId: printer.id,
        type: 'KITCHEN_TICKET',
        data: { orderId, stationId } as never,
        status: 'PENDING',
      },
    });

    try {
      const { TcpPrinterService } = await import('./tcp-printer.service');
      const tcp = new TcpPrinterService();
      const success = await tcp.print(buf, {
        host: printer.ipAddress || 'localhost',
        port: printer.port || 9100,
      });

      await prisma.printJob.update({
        where: { id: job.id },
        data: {
          status: success ? 'COMPLETED' : 'FAILED',
          printedAt: success ? new Date() : null,
          lastError: success ? null : 'Connection failed',
        },
      });

      return success;
    } catch (err) {
      await prisma.printJob.update({
        where: { id: job.id },
        data: { status: 'FAILED', lastError: String(err) },
      });
      return false;
    }
  }

  async printRaw(data: Buffer, printerId: string): Promise<boolean> {
    const printer = await prisma.printer.findUnique({ where: { id: printerId } });
    if (!printer) throw new Error('Printer not found');

    const { TcpPrinterService } = await import('./tcp-printer.service');
    const tcp = new TcpPrinterService();
    return tcp.print(data, {
      host: printer.ipAddress || 'localhost',
      port: printer.port || 9100,
    });
  }

  async testPrinter(printerId: string): Promise<boolean> {
    const printer = await prisma.printer.findUnique({ where: { id: printerId } });
    if (!printer) throw new Error('Printer not found');

    const { TcpPrinterService } = await import('./tcp-printer.service');
    const tcp = new TcpPrinterService();
    return tcp.testConnection({
      host: printer.ipAddress || 'localhost',
      port: printer.port || 9100,
    });
  }
}
