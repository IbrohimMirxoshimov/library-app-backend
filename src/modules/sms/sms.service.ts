import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSmsDto } from './dto/create-sms.dto';
import { QuerySmsDto } from './dto/query-sms.dto';
import { BulkSmsDto } from './dto/bulk-sms.dto';
import { UpdateSmsDto } from './dto/update-sms.dto';
import { BulkStatusUpdateDto } from './dto/bulk-status-update.dto';
import { PaginatedResponse } from '../../common/dto/paginated-response.dto';
import { Prisma, SmsStatus, SmsProvider } from '@prisma/client';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * List SMS messages with pagination and filters.
   */
  async findAll(query: QuerySmsDto) {
    const where: Prisma.SmsWhereInput = {};

    if (query.ids?.length) {
      where.id = { in: query.ids };
    }

    if (query.userId) {
      where.userId = query.userId;
    }

    if (query.phone) {
      where.phone = query.phone;
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.provider) {
      where.provider = query.provider;
    }

    const page = query.page ?? 1;
    const size = query.size ?? 20;

    const items = await this.prisma.sms.findMany({
      where,
      skip: (page - 1) * size,
      take: size,
      orderBy: { [query.sort ?? 'createdAt']: query.order ?? 'desc' },
      include: { user: { select: { id: true, firstName: true, lastName: true, phone: true } } },
    });

    const total = query.ids?.length ? items.length : await this.prisma.sms.count({ where });

    return new PaginatedResponse(items, page, size, total);
  }

  /**
   * Get a single SMS by ID.
   */
  async findOne(id: number) {
    const sms = await this.prisma.sms.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, phone: true } },
        device: { select: { id: true, brand: true, model: true } },
        smsBulk: { select: { id: true, text: true } },
      },
    });

    if (!sms) {
      throw new NotFoundException('SMS topilmadi');
    }

    return sms;
  }

  /**
   * Create a single SMS record (status: DRAFT).
   * Does NOT actually send — sending is handled by gateway push or Eskiz integration.
   */
  async sendSingle(dto: CreateSmsDto) {
    const sms = await this.prisma.sms.create({
      data: {
        phone: dto.phone,
        text: dto.text,
        status: SmsStatus.DRAFT,
        provider: dto.provider ?? SmsProvider.GATEWAY,
        userId: dto.userId,
        deviceId: dto.deviceId,
      },
    });

    this.logger.log(`SMS created: id=${sms.id}, phone=${sms.phone}`);

    return sms;
  }

  /**
   * Create bulk SMS records from a list of phones or user IDs.
   * Creates a SmsBulk batch record and individual Sms records for each recipient.
   */
  async createBulk(dto: BulkSmsDto, creatorId: number) {
    const phones: string[] = [];

    // If specific phones provided, use them directly
    if (dto.phones && dto.phones.length > 0) {
      phones.push(...dto.phones);
    }

    // If user IDs provided, look up their phone numbers
    if (dto.userIds && dto.userIds.length > 0) {
      const users = await this.prisma.user.findMany({
        where: { id: { in: dto.userIds }, phone: { not: null }, deletedAt: null },
        select: { phone: true },
      });

      for (const user of users) {
        if (user.phone) {
          phones.push(user.phone);
        }
      }
    }

    if (phones.length === 0) {
      return { count: 0, bulkId: null };
    }

    // Deduplicate phone numbers
    const uniquePhones = [...new Set(phones)];

    const provider = dto.provider ?? SmsProvider.GATEWAY;

    // Create bulk batch + individual SMS records in a transaction
    const result = await this.prisma.$transaction(async (tx) => {
      const bulk = await tx.smsBulk.create({
        data: {
          text: dto.text,
          userId: creatorId,
        },
      });

      await tx.sms.createMany({
        data: uniquePhones.map((phone) => ({
          phone,
          text: dto.text,
          status: SmsStatus.DRAFT,
          provider,
          smsBulkId: bulk.id,
          deviceId: dto.deviceId,
        })),
      });

      return bulk;
    });

    this.logger.log(`Bulk SMS created: bulkId=${result.id}, count=${uniquePhones.length}`);

    return { count: uniquePhones.length, bulkId: result.id };
  }

  /**
   * Update a single SMS record (status, error reason).
   */
  async update(id: number, dto: UpdateSmsDto) {
    await this.findOne(id);

    return this.prisma.sms.update({
      where: { id },
      data: dto,
    });
  }

  /**
   * Bulk update SMS statuses.
   */
  async bulkStatusUpdate(dto: BulkStatusUpdateDto) {
    const result = await this.prisma.sms.updateMany({
      where: { id: { in: dto.ids } },
      data: { status: dto.status },
    });

    return { updated: result.count };
  }

  /**
   * Get SMS conversations — latest message per phone number.
   * Groups by phone and returns the most recent SMS for each.
   */
  async getConversations(query: QuerySmsDto) {
    const page = query.page ?? 1;
    const size = query.size ?? 20;
    const offset = (page - 1) * size;

    // Use raw query for efficient conversation grouping —
    // Prisma doesn't support DISTINCT ON directly
    const conversations = await this.prisma.$queryRaw<
      Array<{
        phone: string;
        last_text: string | null;
        last_status: SmsStatus;
        last_updated: Date;
        total_count: bigint;
      }>
    >`
      SELECT
        s.phone,
        s.text AS last_text,
        s.status AS last_status,
        s."updatedAt" AS last_updated,
        COUNT(*) OVER () AS total_count
      FROM sms s
      INNER JOIN (
        SELECT phone, MAX("updatedAt") AS max_updated
        FROM sms
        GROUP BY phone
      ) latest ON s.phone = latest.phone AND s."updatedAt" = latest.max_updated
      ORDER BY s."updatedAt" DESC
      LIMIT ${size} OFFSET ${offset}
    `;

    const totalItems = conversations.length > 0 ? Number(conversations[0].total_count) : 0;

    const items = conversations.map((c) => ({
      phone: c.phone,
      lastText: c.last_text,
      lastStatus: c.last_status,
      lastUpdated: c.last_updated,
    }));

    return new PaginatedResponse(items, page, size, totalItems);
  }

  /**
   * Get all SMS for a specific phone number (conversation thread).
   */
  async getConversationByPhone(phone: string, query: QuerySmsDto) {
    const page = query.page ?? 1;
    const size = query.size ?? 20;

    const where: Prisma.SmsWhereInput = { phone };

    const [items, total] = await Promise.all([
      this.prisma.sms.findMany({
        where,
        skip: (page - 1) * size,
        take: size,
        orderBy: { updatedAt: 'desc' },
        include: { user: { select: { id: true, firstName: true, lastName: true } } },
      }),
      this.prisma.sms.count({ where }),
    ]);

    return new PaginatedResponse(items, page, size, total);
  }
}
