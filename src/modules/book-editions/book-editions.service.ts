import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookEditionDto } from './dto/create-book-editions.dto';
import { UpdateBookEditionDto } from './dto/update-book-editions.dto';
import { QueryBookEditionDto } from './dto/query-book-editions.dto';
import { PaginatedResponse } from '../../common/dto/paginated-response.dto';

@Injectable()
export class BookEditionService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: QueryBookEditionDto) {
    const where: Record<string, unknown> = { deletedAt: null, };

    if (query.ids?.length) {
      where.id = { in: query.ids };
    }

    const page = query.page ?? 1;
    const size = query.size ?? 20;

    const items = await this.prisma.bookEdition.findMany({
      where,
      skip: (page - 1) * size,
      take: size,
      orderBy: { [query.sort ?? 'createdAt']: query.order ?? 'desc' },
      include: { book: true, publisher: true },
    });

    const total = query.ids?.length ? items.length : await this.prisma.bookEdition.count({ where });

    return new PaginatedResponse(items, page, size, total);
  }

  async findOne(id: number) {
    const item = await this.prisma.bookEdition.findFirst({
      where: { id, deletedAt: null, },
      include: { book: true, publisher: true },
    });

    if (!item) {
      throw new NotFoundException('Topilmadi');
    }

    return item;
  }

  async create(dto: CreateBookEditionDto) {
    const data: Record<string, unknown> = { ...dto };

    return this.prisma.bookEdition.create({ data: data as never });
  }

  async update(id: number, dto: UpdateBookEditionDto) {
    await this.findOne(id);
    const data: Record<string, unknown> = { ...dto };

    return this.prisma.bookEdition.update({
      where: { id },
      data: data as never,
    });
  }
}
