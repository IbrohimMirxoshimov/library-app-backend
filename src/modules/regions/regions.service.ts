import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRegionDto } from './dto/create-regions.dto';
import { UpdateRegionDto } from './dto/update-regions.dto';
import { QueryRegionDto } from './dto/query-regions.dto';
import { PaginatedResponse } from '../../common/dto/paginated-response.dto';

@Injectable()
export class RegionService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: QueryRegionDto) {
    const where: Record<string, unknown> = { deletedAt: null, };

    if (query.ids?.length) {
      where.id = { in: query.ids };
    }

    const page = query.page ?? 1;
    const size = query.size ?? 20;

    const items = await this.prisma.region.findMany({
      where,
      skip: (page - 1) * size,
      take: size,
      orderBy: { [query.sort ?? 'createdAt']: query.order ?? 'desc' },
      include: { parent: true, children: true },
    });

    const total = query.ids?.length ? items.length : await this.prisma.region.count({ where });

    return new PaginatedResponse(items, page, size, total);
  }

  async findOne(id: number) {
    const item = await this.prisma.region.findFirst({
      where: { id, deletedAt: null, },
      include: { parent: true, children: true },
    });

    if (!item) {
      throw new NotFoundException('Topilmadi');
    }

    return item;
  }

  async create(dto: CreateRegionDto) {
    const data: Record<string, unknown> = { ...dto };

    return this.prisma.region.create({ data: data as never });
  }

  async update(id: number, dto: UpdateRegionDto) {
    await this.findOne(id);
    const data: Record<string, unknown> = { ...dto };

    return this.prisma.region.update({
      where: { id },
      data: data as never,
    });
  }
}
