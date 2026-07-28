import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { prisma } from '@openpos/database';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';

const BCRYPT_ROUNDS = 12;

async function hashPassword(password: string): Promise<string> {
  const bcrypt = await import('bcryptjs');
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

@Injectable()
export class UsersService {
  async findAll(params?: { page?: number; limit?: number; search?: string }) {
    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { deletedAt: null };

    if (params?.search) {
      where.OR = [
        { fullName: { contains: params.search, mode: 'insensitive' } },
        { username: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          role: { select: { id: true, name: true } },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      users: users.map((u) => ({
        id: u.id,
        fullName: u.fullName,
        username: u.username,
        isActive: u.isActive,
        branchId: u.branchId,
        lastLoginAt: u.lastLoginAt,
        createdAt: u.createdAt,
        role: u.role,
      })),
      meta: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  async findById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id, deletedAt: null },
      include: {
        role: { select: { id: true, name: true } },
      },
    });

    if (!user) throw new NotFoundException('User not found');
    return {
      id: user.id,
      fullName: user.fullName,
      username: user.username,
      isActive: user.isActive,
      branchId: user.branchId,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      role: user.role,
    };
  }

  async create(dto: CreateUserDto) {
    const existing = await prisma.user.findUnique({
      where: { username: dto.username },
    });
    if (existing) throw new ConflictException('Username already exists');

    const role = await prisma.role.findFirst({
      where: { name: dto.role },
    });
    if (!role) throw new NotFoundException(`Role ${dto.role} not found`);

    const passwordHash = await hashPassword(dto.password);

    const user = await prisma.user.create({
      data: {
        fullName: dto.fullName,
        username: dto.username,
        passwordHash,
        pinCode: dto.pinCode ?? null,
        roleId: role.id,
        branchId: dto.branchId ?? null,
      },
      include: {
        role: { select: { id: true, name: true } },
      },
    });

    return {
      id: user.id,
      fullName: user.fullName,
      username: user.username,
      isActive: user.isActive,
      branchId: user.branchId,
      createdAt: user.createdAt,
      role: user.role,
    };
  }

  async update(id: string, dto: UpdateUserDto) {
    const existing = await prisma.user.findUnique({
      where: { id, deletedAt: null },
    });
    if (!existing) throw new NotFoundException('User not found');

    const data: Record<string, unknown> = {};
    if (dto.fullName !== undefined) data.fullName = dto.fullName;
    if (dto.pinCode !== undefined) data.pinCode = dto.pinCode;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;
    if (dto.branchId !== undefined) data.branchId = dto.branchId;

    if (dto.role) {
      const role = await prisma.role.findFirst({ where: { name: dto.role } });
      if (!role) throw new NotFoundException(`Role ${dto.role} not found`);
      data.roleId = role.id;
    }

    const user = await prisma.user.update({
      where: { id },
      data,
      include: {
        role: { select: { id: true, name: true } },
      },
    });

    return {
      id: user.id,
      fullName: user.fullName,
      username: user.username,
      isActive: user.isActive,
      branchId: user.branchId,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      role: user.role,
    };
  }

  async remove(id: string) {
    const existing = await prisma.user.findUnique({
      where: { id, deletedAt: null },
    });
    if (!existing) throw new NotFoundException('User not found');

    await prisma.user.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });

    return { message: 'User deleted successfully' };
  }
}
