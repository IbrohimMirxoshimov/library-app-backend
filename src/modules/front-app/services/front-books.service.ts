import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PaginatedResponse } from '../../../common/dto/paginated-response.dto';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { generateSearchableName } from '../../../common/utils/string.utils';
import { Prisma } from '@prisma/client';

@Injectable()
export class FrontBooksService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: PaginationQueryDto & { collectionId?: number; authorId?: number }) {
    const where: Prisma.BookWhereInput = {
      deletedAt: null,
      // Only show books that have ACTIVE stocks
      stocks: { some: { status: 'ACTIVE', deletedAt: null } },
    };

    if (query.q) {
      where.searchableName = { contains: generateSearchableName(query.q) };
    }

    if (query.ids?.length) {
      where.id = { in: query.ids };
    }

    if (query.collectionId) where.collectionId = query.collectionId;
    if (query.authorId) where.authors = { some: { authorId: query.authorId } };

    const page = query.page ?? 1;
    const size = query.size ?? 20;

    const items = await this.prisma.book.findMany({
      where,
      skip: (page - 1) * size,
      take: size,
      orderBy: { [query.sort ?? 'createdAt']: query.order ?? 'desc' },
      include: {
        authors: { include: { author: true } },
        collection: true,
        _count: {
          select: {
            stocks: { where: { status: 'ACTIVE', deletedAt: null } },
          },
        },
      },
    });

    const total = query.ids?.length ? items.length : await this.prisma.book.count({ where });

    return new PaginatedResponse(items, page, size, total);
  }

  async findOne(id: number) {
    const book = await this.prisma.book.findFirst({
      where: { id, deletedAt: null },
      include: {
        authors: { include: { author: true } },
        collection: true,
        editions: { where: { deletedAt: null }, include: { publisher: true } },
        rules: { include: { library: true } },
        _count: {
          select: {
            stocks: { where: { status: 'ACTIVE', deletedAt: null } },
          },
        },
      },
    });

    if (!book) throw new NotFoundException('Kitob topilmadi');
    return book;
  }

  async getFilters() {
    const [collections, authors] = await Promise.all([
      this.prisma.collection.findMany({
        where: { deletedAt: null },
        orderBy: { sort: 'asc' },
      }),
      this.prisma.author.findMany({
        where: { deletedAt: null },
        orderBy: { name: 'asc' },
        take: 100,
      }),
    ]);

    return { collections, authors };
  }

  async getStatuses(bookId: number) {
    const stocks = await this.prisma.stock.findMany({
      where: { bookId, status: 'ACTIVE', deletedAt: null },
      include: {
        library: true,
        rentals: {
          where: { returnedAt: null, rejected: false, deletedAt: null },
          select: { dueDate: true },
        },
      },
    });

    return stocks.map((stock) => ({
      libraryId: stock.libraryId,
      libraryName: stock.library.name,
      busy: stock.busy,
      dueDate: stock.rentals[0]?.dueDate ?? null,
    }));
  }
}
