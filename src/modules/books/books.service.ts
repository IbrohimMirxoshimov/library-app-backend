import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { QueryBookDto } from './dto/query-book.dto';
import { PaginatedResponse } from '../../common/dto/paginated-response.dto';
import { RequestUser } from '../../common/interfaces/request-user.interface';
import { generateSearchableName } from '../../common/utils/string.utils';
import { Prisma } from '@prisma/client';

@Injectable()
export class BookService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: QueryBookDto) {
    const where: Prisma.BookWhereInput = { deletedAt: null };

    if (query.ids?.length) {
      where.id = { in: query.ids };
    }

    if (query.q) {
      const searchable = generateSearchableName(query.q);
      where.searchableName = { contains: searchable };
    }

    if (query.collectionId) {
      where.collectionId = query.collectionId;
    }

    if (query.authorId) {
      where.authors = { some: { authorId: query.authorId } };
    }

    if (query.language) {
      where.language = query.language;
    }

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
        _count: { select: { stocks: true } },
      },
    });

    const total = query.ids?.length ? items.length : await this.prisma.book.count({ where });

    return new PaginatedResponse(items, page, size, total);
  }

  async findOne(id: number, user: RequestUser) {
    const book = await this.prisma.book.findFirst({
      where: { id, deletedAt: null },
      include: {
        authors: { include: { author: true } },
        collection: true,
        editions: { include: { publisher: true } },
        _count: { select: { stocks: true } },
      },
    });

    if (!book) {
      throw new NotFoundException('Kitob topilmadi');
    }

    // Include BookRule only for user's own library
    let bookRule = null;
    if (user.adminLibraryId) {
      bookRule = await this.prisma.bookRule.findUnique({
        where: {
          bookId_libraryId: { bookId: id, libraryId: user.adminLibraryId },
        },
      });
    }

    return { ...book, bookRule };
  }

  async create(dto: CreateBookDto, user: RequestUser) {
    const { authorIds, bookRule: bookRuleDto, ...bookData } = dto;

    // Build searchable name from book name + author names
    let authorNames: string[] = [];
    if (authorIds && authorIds.length > 0) {
      const authors = await this.prisma.author.findMany({
        where: { id: { in: authorIds } },
        select: { name: true },
      });
      authorNames = authors.map((a) => a.name);
    }

    const searchableName = generateSearchableName(dto.name, ...authorNames);

    const book = await this.prisma.book.create({
      data: {
        ...bookData,
        searchableName,
        creatorId: user.id || undefined,
        authors: authorIds
          ? {
              create: authorIds.map((authorId) => ({
                authorId,
              })),
            }
          : undefined,
      },
      include: {
        authors: { include: { author: true } },
        collection: true,
      },
    });

    // Create BookRule if user has adminLibraryId
    let bookRule = null;
    if (user.adminLibraryId) {
      bookRule = await this.prisma.bookRule.create({
        data: {
          bookId: book.id,
          libraryId: user.adminLibraryId,
          price: bookRuleDto.price,
          rentDuration: bookRuleDto.rentDuration,
          rarity: bookRuleDto.rarity ?? 'COMMON',
        },
      });
    }

    return { ...book, bookRule };
  }

  async update(id: number, dto: UpdateBookDto, user: RequestUser) {
    await this.findOne(id, user);

    const { authorIds, bookRule: bookRuleDto, ...bookData } = dto;

    // Rebuild searchable name if name or authors change
    const updateData: Prisma.BookUpdateInput = { ...bookData };

    if (dto.name || authorIds) {
      const current = await this.prisma.book.findUnique({
        where: { id },
        include: { authors: { include: { author: true } } },
      });

      let authorNames: string[];
      if (authorIds) {
        const authors = await this.prisma.author.findMany({
          where: { id: { in: authorIds } },
          select: { name: true },
        });
        authorNames = authors.map((a) => a.name);
      } else {
        authorNames = current?.authors.map((ba) => ba.author.name) ?? [];
      }

      updateData.searchableName = generateSearchableName(
        dto.name ?? current?.name ?? '',
        ...authorNames,
      );
    }

    // Update authors if provided (replace all)
    if (authorIds) {
      await this.prisma.bookAuthor.deleteMany({ where: { bookId: id } });
      await this.prisma.bookAuthor.createMany({
        data: authorIds.map((authorId) => ({ bookId: id, authorId })),
      });
    }

    const book = await this.prisma.book.update({
      where: { id },
      data: updateData,
      include: {
        authors: { include: { author: true } },
        collection: true,
      },
    });

    // Update BookRule if user has adminLibraryId and bookRule provided
    let bookRule = null;
    if (user.adminLibraryId) {
      if (bookRuleDto) {
        const ruleData: Prisma.BookRuleUpdateInput = {};
        if (bookRuleDto.price !== undefined) ruleData.price = bookRuleDto.price;
        if (bookRuleDto.rentDuration !== undefined) ruleData.rentDuration = bookRuleDto.rentDuration;
        if (bookRuleDto.rarity !== undefined) ruleData.rarity = bookRuleDto.rarity;

        bookRule = await this.prisma.bookRule.upsert({
          where: {
            bookId_libraryId: { bookId: id, libraryId: user.adminLibraryId },
          },
          update: ruleData,
          create: {
            bookId: id,
            libraryId: user.adminLibraryId,
            price: bookRuleDto.price ?? 50000,
            rentDuration: bookRuleDto.rentDuration ?? 15,
            rarity: bookRuleDto.rarity ?? 'COMMON',
          },
        });
      } else {
        // No bookRule in update — still return existing rule
        bookRule = await this.prisma.bookRule.findUnique({
          where: {
            bookId_libraryId: { bookId: id, libraryId: user.adminLibraryId },
          },
        });
      }
    }

    return { ...book, bookRule };
  }
}
