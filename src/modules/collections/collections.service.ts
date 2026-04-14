import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCollectionDto } from './dto/create-collections.dto';
import { UpdateCollectionDto } from './dto/update-collections.dto';
import { QueryCollectionDto } from './dto/query-collections.dto';
import { PaginatedResponse } from '../../common/dto/paginated-response.dto';

@Injectable()
export class CollectionService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: QueryCollectionDto) {
    const where: Record<string, unknown> = { deletedAt: null, };

    if (query.ids?.length) {
      where.id = { in: query.ids };
    }

    const page = query.page ?? 1;
    const size = query.size ?? 20;

    const items = await this.prisma.collection.findMany({
      where,
      skip: (page - 1) * size,
      take: size,
      orderBy: { [query.sort ?? 'createdAt']: query.order ?? 'desc' },
    });

    const total = query.ids?.length ? items.length : await this.prisma.collection.count({ where });

    return new PaginatedResponse(items, page, size, total);
  }

  async findOne(id: number) {
    const item = await this.prisma.collection.findFirst({
      where: { id, deletedAt: null, },
    });

    if (!item) {
      throw new NotFoundException('Topilmadi');
    }

    return item;
  }

  async create(dto: CreateCollectionDto) {
    const data: Record<string, unknown> = { ...dto };

    return this.prisma.collection.create({ data: data as never });
  }

  async update(id: number, dto: UpdateCollectionDto) {
    await this.findOne(id);
    const data: Record<string, unknown> = { ...dto };

    return this.prisma.collection.update({
      where: { id },
      data: data as never,
    });
  }
}
