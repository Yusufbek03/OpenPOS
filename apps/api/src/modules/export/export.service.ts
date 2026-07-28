import { Injectable } from '@nestjs/common';
import { prisma } from '@openpos/database';
import type { Response } from 'express';

@Injectable()
export class ExportService {
  async ordersCsv(res: Response, params?: { from?: string; to?: string; status?: string }) {
    const where: Record<string, unknown> = {};
    if (params?.status) where.status = params.status;
    if (params?.from || params?.to) {
      where.createdAt = {};
      if (params.from) (where.createdAt as Record<string, unknown>).gte = new Date(params.from);
      if (params.to) (where.createdAt as Record<string, unknown>).lte = new Date(params.to);
    }

    const orders = await prisma.order.findMany({
      where,
      include: { cashier: { select: { fullName: true } }, items: true, payments: true },
      orderBy: { createdAt: 'desc' },
    });

    const header = 'Номер,Дата,Кассир,Товаров,Скидка,Итого,Статус,Оплата\n';
    const rows = orders.map(o =>
      `${o.orderNumber},${o.createdAt.toISOString()},${o.cashier?.fullName || ''},${o.items.length},${o.discount},${o.total},${o.status},${o.payments.map(p => `${p.method}:${p.amount}`).join('; ')}`
    ).join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="orders_${Date.now()}.csv"`);
    res.send('\uFEFF' + header + rows);
  }

  async ordersExcel(res: Response, params?: { from?: string; to?: string; status?: string }) {
    const ExcelJS = await import('exceljs');
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Заказы');

    const where: Record<string, unknown> = {};
    if (params?.status) where.status = params.status;
    if (params?.from || params?.to) {
      where.createdAt = {};
      if (params.from) (where.createdAt as Record<string, unknown>).gte = new Date(params.from);
      if (params.to) (where.createdAt as Record<string, unknown>).lte = new Date(params.to);
    }

    const orders = await prisma.order.findMany({
      where,
      include: { cashier: { select: { fullName: true } }, items: true, payments: true },
      orderBy: { createdAt: 'desc' },
    });

    sheet.columns = [
      { header: 'Номер', key: 'number', width: 15 },
      { header: 'Дата', key: 'date', width: 20 },
      { header: 'Кассир', key: 'cashier', width: 20 },
      { header: 'Товаров', key: 'items', width: 10 },
      { header: 'Скидка', key: 'discount', width: 12 },
      { header: 'Итого', key: 'total', width: 15 },
      { header: 'Статус', key: 'status', width: 15 },
      { header: 'Оплата', key: 'payment', width: 25 },
    ];

    sheet.getRow(1).font = { bold: true };

    for (const o of orders) {
      sheet.addRow({
        number: o.orderNumber,
        date: o.createdAt.toLocaleString('ru-RU'),
        cashier: o.cashier?.fullName || '',
        items: o.items.length,
        discount: Number(o.discount),
        total: Number(o.total),
        status: o.status,
        payment: o.payments.map(p => `${p.method}: ${Number(p.amount).toLocaleString('uz-UZ')}`).join(', '),
      });
    }

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="orders_${Date.now()}.xlsx"`);
    await workbook.xlsx.write(res);
    res.end();
  }

  async salesCsv(res: Response, params?: { from?: string; to?: string }) {
    const where: Record<string, unknown> = { status: 'COMPLETED' };
    if (params?.from || params?.to) {
      where.createdAt = {};
      if (params.from) (where.createdAt as Record<string, unknown>).gte = new Date(params.from);
      if (params.to) (where.createdAt as Record<string, unknown>).lte = new Date(params.to);
    }

    const orders = await prisma.order.findMany({
      where,
      include: { items: { include: { product: { select: { nameRu: true } } } } },
    });

    const productMap = new Map<string, { name: string; qty: number; total: number }>();
    for (const o of orders) {
      for (const item of o.items) {
        const key = item.productId;
        const existing = productMap.get(key) ?? { name: item.product.nameRu, qty: 0, total: 0 };
        existing.qty += Number(item.quantity);
        existing.total += Number(item.total);
        productMap.set(key, existing);
      }
    }

    const header = 'Товар,Кол-во,Сумма\n';
    const rows = Array.from(productMap.values())
      .sort((a, b) => b.total - a.total)
      .map(p => `${p.name},${p.qty},${p.total}`)
      .join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="sales_${Date.now()}.csv"`);
    res.send('\uFEFF' + header + rows);
  }

  async salesExcel(res: Response, params?: { from?: string; to?: string }) {
    const ExcelJS = await import('exceljs');
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Продажи');

    const where: Record<string, unknown> = { status: 'COMPLETED' };
    if (params?.from || params?.to) {
      where.createdAt = {};
      if (params.from) (where.createdAt as Record<string, unknown>).gte = new Date(params.from);
      if (params.to) (where.createdAt as Record<string, unknown>).lte = new Date(params.to);
    }

    const orders = await prisma.order.findMany({
      where,
      include: { items: { include: { product: { select: { nameRu: true } } } } },
    });

    const productMap = new Map<string, { name: string; qty: number; total: number }>();
    for (const o of orders) {
      for (const item of o.items) {
        const key = item.productId;
        const existing = productMap.get(key) ?? { name: item.product.nameRu, qty: 0, total: 0 };
        existing.qty += Number(item.quantity);
        existing.total += Number(item.total);
        productMap.set(key, existing);
      }
    }

    sheet.columns = [
      { header: 'Товар', key: 'name', width: 30 },
      { header: 'Кол-во', key: 'qty', width: 12 },
      { header: 'Сумма', key: 'total', width: 15 },
    ];
    sheet.getRow(1).font = { bold: true };

    for (const p of Array.from(productMap.values()).sort((a, b) => b.total - a.total)) {
      sheet.addRow(p);
    }

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="sales_${Date.now()}.xlsx"`);
    await workbook.xlsx.write(res);
    res.end();
  }
}
