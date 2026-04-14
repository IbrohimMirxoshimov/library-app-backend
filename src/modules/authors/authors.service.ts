import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAuthorDto } from './dto/create-authors.dto';
import { UpdateAuthorDto } from './dto/update-authors.dto';
import { QueryAuthorDto } from './dto/query-authors.dto';
import { PaginatedResponse } from '../../common/dto/paginated-response.dto';
import { generateSearchableName } from '../../common/utils/string.utils';

@Injectable()
export class AuthorService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: QueryAuthorDto) {
    const where: Record<string, unknown> = { deletedAt: null, };
      if (query.ids?.length) {
        where.id = { in: query.ids };
      }
      if (query.q) {
        const searchable = generateSearchableName(query.q);
        where.searchableName = { contains: searchable };
      }

    const page = query.page ?? 1;
    const size = query.size ?? 20;

    const items = await this.prisma.author.findMany({
      where,
      skip: (page - 1) * size,
      take: size,
      orderBy: { [query.sort ?? 'createdAt']: query.order ?? 'desc' },
    });

    const total = query.ids?.length ? items.length : await this.prisma.author.count({ where });

    return new PaginatedResponse(items, page, size, total);
  }

  async findOne(id: number) {
    const item = await this.prisma.author.findFirst({
      where: { id, deletedAt: null, },
    });

    if (!item) {
      throw new NotFoundException('Topilmadi');
    }

    return item;
  }

  async create(dto: CreateAuthorDto) {
    const data: Record<string, unknown> = { ...dto };
      data.searchableName = generateSearchableName(dto.name);

    return this.prisma.author.create({ data: data as never });
  }

  async update(id: number, dto: UpdateAuthorDto) {
    await this.findOne(id);
    const data: Record<string, unknown> = { ...dto };
      if (dto.name) {
        data.searchableName = generateSearchableName(dto.name);
      }

    return this.prisma.author.update({
      where: { id },
      data: data as never,
    });
  }
}
