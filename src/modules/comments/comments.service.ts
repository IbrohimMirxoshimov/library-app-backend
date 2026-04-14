import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { QueryCommentDto } from './dto/query-comment.dto';
import { PaginatedResponse } from '../../common/dto/paginated-response.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class CommentService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: QueryCommentDto) {
    const where: Prisma.CommentWhereInput = {};

    if (query.ids?.length) {
      where.id = { in: query.ids };
    }

    if (query.stockId) where.stockId = query.stockId;
    if (query.rentalId) where.rentalId = query.rentalId;

    const page = query.page ?? 1;
    const size = query.size ?? 20;

    const items = await this.prisma.comment.findMany({
      where,
      skip: (page - 1) * size,
      take: size,
      orderBy: { createdAt: 'desc' },
      include: {
        author: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    const total = query.ids?.length ? items.length : await this.prisma.comment.count({ where });

    return new PaginatedResponse(items, page, size, total);
  }

  async create(dto: CreateCommentDto, authorId: number) {
    // Exactly one of stockId/rentalId must be provided
    if (!dto.stockId && !dto.rentalId) {
      throw new BadRequestException('stockId yoki rentalId kerak');
    }
    if (dto.stockId && dto.rentalId) {
      throw new BadRequestException('Faqat bitta: stockId yoki rentalId');
    }

    return this.prisma.comment.create({
      data: {
        text: dto.text,
        stockId: dto.stockId,
        rentalId: dto.rentalId,
        authorId,
      },
      include: {
        author: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }
}
