import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateAccountDto } from '../dto/update-account.dto';
import { normalizePhone } from '../../../common/utils/phone.utils';
import { capitalize } from '../../../common/utils/string.utils';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { PaginatedResponse } from '../../../common/dto/paginated-response.dto';

@Injectable()
export class FrontAccountService {
  constructor(private prisma: PrismaService) {}

  async getProfile(userId: number) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        gender: true,
        birthDate: true,
        verified: true,
        phoneVerified: true,
        status: true,
        balance: true,
        telegramId: true,
        libraries: { include: { library: { select: { id: true, name: true } } } },
      },
    });

    if (!user) throw new NotFoundException('Profil topilmadi');
    return user;
  }

  async updateProfile(userId: number, dto: UpdateAccountDto) {
    if (dto.firstName) dto.firstName = capitalize(dto.firstName);
    if (dto.lastName) dto.lastName = capitalize(dto.lastName);
    if (dto.phone) dto.phone = normalizePhone(dto.phone) ?? dto.phone;

    const data: Record<string, unknown> = {};
    if (dto.firstName) data.firstName = dto.firstName;
    if (dto.lastName) data.lastName = dto.lastName;
    if (dto.phone) {
      data.phone = dto.phone;
      data.phoneVerified = false; // Require re-verification
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: data as never,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        phoneVerified: true,
      },
    });
  }

  async getMyBooks(userId: number, query: PaginationQueryDto & { active?: boolean }) {
    const where = {
      readerId: userId,
      deletedAt: null as Date | null,
      rejected: false,
      ...(query.active ? { returnedAt: null } : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.rental.findMany({
        where,
        skip: ((query.page ?? 1) - 1) * (query.size ?? 20),
        take: query.size ?? 20,
        orderBy: { createdAt: 'desc' },
        include: {
          stock: {
            include: {
              book: { include: { authors: { include: { author: true } } } },
            },
          },
          library: { select: { id: true, name: true } },
        },
      }),
      this.prisma.rental.count({ where }),
    ]);

    return new PaginatedResponse(items, query.page ?? 1, query.size ?? 20, total);
  }
}
