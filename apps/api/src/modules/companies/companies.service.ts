import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { prisma } from '@openpos/database';
import { CreateCompanyDto, UpdateCompanyDto } from './dto/company.dto';

@Injectable()
export class CompaniesService {
  async findAll(params?: { page?: number; limit?: number; search?: string }) {
    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { deletedAt: null };
    if (params?.search) {
      where.OR = [
        { name: { contains: params.search, mode: 'insensitive' } },
        { inn: { contains: params.search } },
      ];
    }

    const [companies, total] = await Promise.all([
      prisma.company.findMany({
        where,
        include: { _count: { select: { branches: true } } },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.company.count({ where }),
    ]);

    return {
      companies,
      meta: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  async findById(id: string) {
    const company = await prisma.company.findUnique({
      where: { id, deletedAt: null },
      include: { branches: { where: { deletedAt: null } } },
    });
    if (!company) throw new NotFoundException('Company not found');
    return company;
  }

  async create(dto: CreateCompanyDto) {
    if (dto.inn) {
      const existing = await prisma.company.findFirst({ where: { inn: dto.inn } });
      if (existing) throw new ConflictException('INN already exists');
    }
    return prisma.company.create({ data: dto });
  }

  async update(id: string, dto: UpdateCompanyDto) {
    const existing = await prisma.company.findUnique({ where: { id, deletedAt: null } });
    if (!existing) throw new NotFoundException('Company not found');

    if (dto.inn) {
      const conflict = await prisma.company.findFirst({ where: { inn: dto.inn, NOT: { id } } });
      if (conflict) throw new ConflictException('INN already exists');
    }

    return prisma.company.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    const existing = await prisma.company.findUnique({ where: { id, deletedAt: null } });
    if (!existing) throw new NotFoundException('Company not found');

    await prisma.company.update({ where: { id }, data: { deletedAt: new Date() } });
    return { message: 'Company deleted successfully' };
  }
}
