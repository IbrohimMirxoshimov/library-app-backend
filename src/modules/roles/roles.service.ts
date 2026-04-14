import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoleDto } from './dto/create-roles.dto';
import { UpdateRoleDto } from './dto/update-roles.dto';
import { QueryRoleDto } from './dto/query-roles.dto';
import { PaginatedResponse } from '../../common/dto/paginated-response.dto';

@Injectable()
export class RoleService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: QueryRoleDto) {
    const where: Record<string, unknown> = { };

    if (query.ids?.length) {
      where.id = { in: query.ids };
    }

    const page = query.page ?? 1;
    const size = query.size ?? 20;

    const items = await this.prisma.role.findMany({
      where,
      skip: (page - 1) * size,
      take: size,
      orderBy: { [query.sort ?? 'createdAt']: query.order ?? 'desc' },
    });

    const total = query.ids?.length ? items.length : await this.prisma.role.count({ where });

    return new PaginatedResponse(items, page, size, total);
  }

  async findOne(id: number) {
    const item = await this.prisma.role.findFirst({
      where: { id, },
    });

    if (!item) {
      throw new NotFoundException('Topilmadi');
    }

    return item;
  }

  async create(dto: CreateRoleDto) {
    const data: Record<string, unknown> = { ...dto };

    return this.prisma.role.create({ data: data as never });
  }

  async update(id: number, dto: UpdateRoleDto) {
    await this.findOne(id);
    const data: Record<string, unknown> = { ...dto };

    return this.prisma.role.update({
      where: { id },
      data: data as never,
    });
  }
}
