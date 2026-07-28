import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { prisma } from '@openpos/database';

@Injectable()
export class AuditService {
  async findAll(params?: { page?: number; limit?: number; userId?: string; entity?: string; action?: string }) {
    const page = params?.page || 1;
    const limit = params?.limit || 50;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (params?.userId) where.userId = params.userId;
    if (params?.entity) where.entity = params.entity;
    if (params?.action) where.action = params.action;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: { select: { id: true, fullName: true, username: true } },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return { logs, meta: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  async log(data: {
    userId: string;
    action: string;
    entity: string;
    entityId?: string;
    oldValues?: Record<string, unknown>;
    newValues?: Record<string, unknown>;
    ipAddress?: string;
    deviceId?: string;
  }) {
    return prisma.auditLog.create({
      data: {
        userId: data.userId,
        action: data.action,
        entity: data.entity,
        entityId: data.entityId ?? null,
        oldValues: data.oldValues as Prisma.InputJsonValue | undefined,
        newValues: data.newValues as Prisma.InputJsonValue | undefined,
        ipAddress: data.ipAddress ?? null,
        deviceId: data.deviceId ?? null,
      },
    });
  }
}
