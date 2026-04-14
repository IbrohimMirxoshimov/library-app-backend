import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePublisherDto } from './dto/create-publishers.dto';
import { UpdatePublisherDto } from './dto/update-publishers.dto';
import { QueryPublisherDto } from './dto/query-publishers.dto';
import { PaginatedResponse } from '../../common/dto/paginated-response.dto';

@Injectable()
export class PublisherService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: QueryPublisherDto) {
    const where: Record<string, unknown> = { deletedAt: null, };

    if (query.ids?.length) {
      where.id = { in: query.ids };
    }

    const page = query.page ?? 1;
    const size = query.size ?? 20;

    const items = await this.prisma.publisher.findMany({
      where,
      skip: (page - 1) * size,
      take: size,
      orderBy: { [query.sort ?? 'createdAt']: query.order ?? 'desc' },
    });

    const total = query.ids?.length ? items.length : await this.prisma.publisher.count({ where });

    return new PaginatedResponse(items, page, size, total);
  }

  async findOne(id: number) {
    const item = await this.prisma.publisher.findFirst({
      where: { id, deletedAt: null, },
    });

    if (!item) {
      throw new NotFoundException('Topilmadi');
    }

    return item;
  }

  async create(dto: CreatePublisherDto) {
    const data: Record<string, unknown> = { ...dto };

    return this.prisma.publisher.create({ data: data as never });
  }

  async update(id: number, dto: UpdatePublisherDto) {
    await this.findOne(id);
    const data: Record<string, unknown> = { ...dto };

    return this.prisma.publisher.update({
      where: { id },
      data: data as never,
    });
  }
}
