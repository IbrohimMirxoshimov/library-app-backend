import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLibraryDto } from './dto/create-libraries.dto';
import { UpdateLibraryDto } from './dto/update-libraries.dto';
import { QueryLibraryDto } from './dto/query-libraries.dto';
import { PaginatedResponse } from '../../common/dto/paginated-response.dto';

@Injectable()
export class LibraryService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: QueryLibraryDto) {
    const where: Record<string, unknown> = { deletedAt: null, };

    if (query.ids?.length) {
      where.id = { in: query.ids };
    }

    const page = query.page ?? 1;
    const size = query.size ?? 20;

    const items = await this.prisma.library.findMany({
      where,
      skip: (page - 1) * size,
      take: size,
      orderBy: { [query.sort ?? 'createdAt']: query.order ?? 'desc' },
      include: { address: { include: { region: true } } },
    });

    const total = query.ids?.length ? items.length : await this.prisma.library.count({ where });

    return new PaginatedResponse(items, page, size, total);
  }

  async findOne(id: number) {
    const item = await this.prisma.library.findFirst({
      where: { id, deletedAt: null, },
      include: { address: { include: { region: true } } },
    });

    if (!item) {
      throw new NotFoundException('Topilmadi');
    }

    return item;
  }

  async create(dto: CreateLibraryDto) {
    const data: Record<string, unknown> = { ...dto };

    return this.prisma.library.create({ data: data as never });
  }

  async update(id: number, dto: UpdateLibraryDto) {
    await this.findOne(id);
    const data: Record<string, unknown> = { ...dto };

    return this.prisma.library.update({
      where: { id },
      data: data as never,
    });
  }
}
