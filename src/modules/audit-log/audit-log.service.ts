import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QueryAuditLogDto } from './dto/query-audit-log.dto';
import { PaginatedResponse } from '../../common/dto/paginated-response.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class AuditLogService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: QueryAuditLogDto) {
    const where: Prisma.AuditLogWhereInput = {};

    if (query.ids?.length) {
      where.id = { in: query.ids };
    }

    if (query.q) {
      where.resource = { contains: query.q, mode: 'insensitive' };
    }

    const page = query.page ?? 1;
    const size = query.size ?? 20;

    const items = await this.prisma.auditLog.findMany({
      where,
      skip: (page - 1) * size,
      take: size,
      orderBy: { [query.sort ?? 'createdAt']: query.order ?? 'desc' },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    const total = query.ids?.length ? items.length : await this.prisma.auditLog.count({ where });

    return new PaginatedResponse(items, page, size, total);
  }

  async findOne(id: number) {
    const log = await this.prisma.auditLog.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    if (!log) {
      throw new NotFoundException('Audit log topilmadi');
    }

    return log;
  }
}
