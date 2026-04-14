import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStockDto } from './dto/create-stock.dto';
import { UpdateStockDto } from './dto/update-stock.dto';
import { QueryStockDto } from './dto/query-stock.dto';
import { PaginatedResponse } from '../../common/dto/paginated-response.dto';
import { RequestUser } from '../../common/interfaces/request-user.interface';
import { Prisma } from '@prisma/client';

@Injectable()
export class StockService {
  private readonly logger = new Logger(StockService.name);

  constructor(private prisma: PrismaService) {}

  async findAll(query: QueryStockDto, user: RequestUser) {
    const where: Prisma.StockWhereInput = { deletedAt: null };

    if (query.ids?.length) {
      where.id = { in: query.ids };
    }

    // Library scoping
    if (user.roleName !== 'owner' && user.adminLibraryId) {
      where.libraryId = user.adminLibraryId;
    }

    if (query.libraryId) where.libraryId = query.libraryId;
    if (query.bookId) where.bookId = query.bookId;
    if (query.status) where.status = query.status;
    if (query.busy !== undefined) where.busy = query.busy;

    if (query.q) {
      where.book = {
        name: { contains: query.q, mode: 'insensitive' },
      };
    }

    const page = query.page ?? 1;
    const size = query.size ?? 20;

    const items = await this.prisma.stock.findMany({
      where,
      skip: (page - 1) * size,
      take: size,
      orderBy: { [query.sort ?? 'createdAt']: query.order ?? 'desc' },
      include: {
        book: { select: { id: true, name: true } },
      },
    });

    const total = query.ids?.length ? items.length : await this.prisma.stock.count({ where });

    return new PaginatedResponse(items, page, size, total);
  }

  async findOne(id: number) {
    const stock = await this.prisma.stock.findFirst({
      where: { id, deletedAt: null },
      include: {
        book: { include: { authors: { include: { author: true } } } },
        library: true,
        bookRule: true,
        bookEdition: true,
        source: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    if (!stock) {
      throw new NotFoundException('Stock topilmadi');
    }

    return stock;
  }

  async create(dto: CreateStockDto, user: RequestUser) {
    if (!user.adminLibraryId) {
      throw new BadRequestException('Admin kutubxonasi aniqlanmadi');
    }
    const libraryId = user.adminLibraryId;

    // Auto-assign or create BookRule for this book+library combination
    let bookRule = await this.prisma.bookRule.findUnique({
      where: {
        bookId_libraryId: { bookId: dto.bookId, libraryId },
      },
    });

    if (!bookRule) {
      bookRule = await this.prisma.bookRule.create({
        data: {
          bookId: dto.bookId,
          libraryId,
          price: 50000,
          rentDuration: 15,
          rarity: 'COMMON',
        },
      });
      this.logger.log(`Auto-created BookRule for book=${dto.bookId} library=${libraryId}`);
    }

    // Condition validatsiya — NEW dan boshqa holat bo'lsa comment majburiy
    if (dto.condition && dto.condition !== 'NEW' && !dto.comment) {
      throw new BadRequestException('Yangi bo\'lmagan kitob uchun izoh majburiy');
    }

    const stock = await this.prisma.stock.create({
      data: {
        bookId: dto.bookId,
        libraryId,
        bookEditionId: dto.bookEditionId,
        bookRuleId: bookRule.id,
        condition: dto.condition,
        sourceId: dto.sourceId,
      },
      include: {
        book: true,
        library: true,
        bookRule: true,
      },
    });

    // Comment yaratish
    if (dto.comment) {
      await this.prisma.comment.create({
        data: {
          text: dto.comment,
          stockId: stock.id,
          authorId: user.id || null,
        },
      });
    }

    return stock;
  }

  async update(id: number, dto: UpdateStockDto, user: RequestUser) {
    const stock = await this.findOne(id);
    // Admin faqat o'z kutubxonasidagi stockni yangilay oladi
    if (user.roleName !== 'owner' && user.adminLibraryId && stock.libraryId !== user.adminLibraryId) {
      throw new NotFoundException('Stock topilmadi');
    }

    // Condition validatsiya — NEW dan boshqa holat bo'lsa comment majburiy
    if (dto.condition && dto.condition !== 'NEW' && !dto.comment) {
      throw new BadRequestException('Yangi bo\'lmagan kitob uchun izoh majburiy');
    }

    const { comment, ...updateData } = dto;

    const updated = await this.prisma.stock.update({
      where: { id },
      data: updateData,
    });

    if (comment) {
      await this.prisma.comment.create({
        data: {
          text: comment,
          stockId: id,
          authorId: user.id || null,
        },
      });
    }

    return updated;
  }
}
