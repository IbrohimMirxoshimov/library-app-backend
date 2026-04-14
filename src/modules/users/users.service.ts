import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUserDto } from './dto/query-user.dto';
import { PaginatedResponse } from '../../common/dto/paginated-response.dto';
import { RequestUser } from '../../common/interfaces/request-user.interface';
import { capitalize } from '../../common/utils/string.utils';
import { normalizePhone } from '../../common/utils/phone.utils';
import { Prisma } from '@prisma/client';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  async findAll(query: QueryUserDto, currentUser: RequestUser) {
    const where: Prisma.UserWhereInput = {
      deletedAt: null,
      phone: { not: null }, // Faqat telefon raqami bor userlar
    };

    if (query.ids?.length) {
      where.id = { in: query.ids };
    }

    // Library scoping — non-owner admins see only their library's users
    if (currentUser.roleName !== 'owner' && currentUser.adminLibraryId) {
      where.libraries = { some: { libraryId: currentUser.adminLibraryId } };
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.libraryId) {
      where.libraries = { some: { libraryId: query.libraryId } };
    }

    if (query.q) {
      const q = query.q;
      where.OR = [
        { firstName: { contains: q, mode: 'insensitive' } },
        { lastName: { contains: q, mode: 'insensitive' } },
        { phone: { contains: q } },
        { username: { contains: q, mode: 'insensitive' } },
        { extraPhones: { has: q } },
        { passports: { some: { passportId: { contains: q, mode: 'insensitive' } } } },
      ];
      // ID bo'yicha qidirish (masalan "i123" yoki "123")
      const idMatch = q.match(/^i?(\d+)$/);
      if (idMatch) {
        where.OR.push({ id: parseInt(idMatch[1], 10) });
      }
    }

    const page = query.page ?? 1;
    const size = query.size ?? 20;

    const items = await this.prisma.user.findMany({
      where,
      skip: (page - 1) * size,
      take: size,
      orderBy: { [query.sort ?? 'createdAt']: query.order ?? 'desc' },
      include: {
        role: true,
        libraries: { include: { library: true } },
        passports: { where: { isActive: true } },
      },
    });

    const total = query.ids?.length ? items.length : await this.prisma.user.count({ where });

    // Remove password from response
    const safeItems = items.map(({ password: _, ...user }) => user);

    return new PaginatedResponse(safeItems, page, size, total);
  }

  async findOne(id: number, currentUser?: RequestUser) {
    const where: Prisma.UserWhereInput = { id, deletedAt: null };
    // Non-owner admin faqat o'z kutubxonasi userlarini ko'radi
    if (currentUser && currentUser.roleName !== 'owner' && currentUser.adminLibraryId) {
      where.libraries = { some: { libraryId: currentUser.adminLibraryId } };
    }

    const user = await this.prisma.user.findFirst({
      where,
      include: {
        role: true,
        libraries: { include: { library: true } },
        passports: true,
        address: { include: { region: true } },
      },
    });

    if (!user) {
      throw new NotFoundException('Foydalanuvchi topilmadi');
    }

    const { password: _, ...safeUser } = user;
    return safeUser;
  }

  async create(dto: CreateUserDto, currentUser: RequestUser) {
    // Normalize and capitalize
    dto.firstName = capitalize(dto.firstName);
    dto.lastName = capitalize(dto.lastName);

    if (dto.phone) {
      dto.phone = normalizePhone(dto.phone) ?? dto.phone;
    }

    // Hash password if provided
    let hashedPassword: string | undefined;
    if (dto.password) {
      hashedPassword = await bcrypt.hash(dto.password, 10);
    }

    const { password: _, birthDate, passport: passportDto, ...rest } = dto;

    // Passport unique validation
    const existingPassport = await this.prisma.passport.findUnique({
      where: { passportId: passportDto.passportId.toUpperCase() },
    });
    if (existingPassport) {
      throw new BadRequestException('Bu passport raqami allaqachon bazada mavjud');
    }
    if (passportDto.pinfl) {
      const existingPinfl = await this.prisma.passport.findFirst({
        where: { pinfl: passportDto.pinfl },
      });
      if (existingPinfl) {
        throw new BadRequestException('Bu PINFL allaqachon boshqa foydalanuvchiga tegishli');
      }
    }

    const user = await this.prisma.user.create({
      data: {
        ...rest,
        password: hashedPassword,
        birthDate: birthDate ? new Date(birthDate) : undefined,
        creatorId: currentUser.type === 'internal' ? undefined : currentUser.id,
      },
    });

    // Create passport
    await this.prisma.passport.create({
      data: {
        passportId: passportDto.passportId.toUpperCase(),
        pinfl: passportDto.pinfl,
        image: passportDto.image,
        userId: user.id,
      },
    });

    // If admin has a library, auto-link user to that library
    if (currentUser.adminLibraryId) {
      await this.prisma.userLibrary.create({
        data: { userId: user.id, libraryId: currentUser.adminLibraryId },
      });
    }

    this.logger.log(`User created: ${user.firstName} ${user.lastName} (ID: ${user.id})`);

    const { password: __, ...safeUser } = user;
    return safeUser;
  }

  async update(id: number, dto: UpdateUserDto) {
    await this.findOne(id);

    if (dto.firstName) dto.firstName = capitalize(dto.firstName);
    if (dto.lastName) dto.lastName = capitalize(dto.lastName);
    if (dto.phone) dto.phone = normalizePhone(dto.phone) ?? dto.phone;

    let hashedPassword: string | undefined;
    if (dto.password) {
      hashedPassword = await bcrypt.hash(dto.password, 10);
    }

    const { password: _, birthDate, ...rest } = dto;

    const user = await this.prisma.user.update({
      where: { id },
      data: {
        ...rest,
        password: hashedPassword,
        birthDate: birthDate ? new Date(birthDate) : undefined,
      },
    });

    const { password: __, ...safeUser } = user;
    return safeUser;
  }

  /**
   * Cross-library passport lookup.
   * Returns basic info if found, without exposing other library's data.
   */
  async checkPassport(passportId: string, currentUser: RequestUser) {
    const passport = await this.prisma.passport.findUnique({
      where: { passportId: passportId.toUpperCase() },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, phone: true, libraries: true },
        },
      },
    });

    if (!passport) {
      return { found: false };
    }

    // O'z kutubxonasidagi user bo'lsa — allaqachon a'zo
    if (currentUser.adminLibraryId) {
      const alreadyMember = passport.user.libraries.some(
        (ul) => ul.libraryId === currentUser.adminLibraryId,
      );
      if (alreadyMember) {
        throw new BadRequestException('Bu foydalanuvchi allaqachon sizning kutubxonangizda');
      }
    }

    // Random hash yaratib Redis ga saqlash (5 daqiqa TTL)
    const hash = randomUUID();
    await this.redis.set(`link:${hash}`, String(passport.user.id), 'EX', 300);

    return {
      found: true,
      hash,
      firstName: passport.user.firstName,
      lastName: passport.user.lastName,
      phone: passport.user.phone,
    };
  }

  /**
   * Link an existing user to the current admin's library.
   */
  async linkLibrary(hash: string, libraryId: number | undefined, currentUser: RequestUser) {
    const targetLibraryId = currentUser.roleName === 'owner' ? (libraryId ?? currentUser.adminLibraryId) : currentUser.adminLibraryId;
    if (!targetLibraryId) {
      throw new BadRequestException('Kutubxona aniqlanmadi');
    }

    // Redis dan hash orqali userId olish
    const userIdStr = await this.redis.get(`link:${hash}`);
    if (!userIdStr) {
      throw new BadRequestException('Havola eskirgan yoki noto\'g\'ri. Qaytadan passport tekshiring');
    }
    const userId = parseInt(userIdStr, 10);

    // Hash ni o'chirish (bir martalik)
    await this.redis.del(`link:${hash}`);

    // Check if user exists
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
    });
    if (!user) {
      throw new NotFoundException('Foydalanuvchi topilmadi');
    }

    // Check if already linked
    const existing = await this.prisma.userLibrary.findUnique({
      where: {
        userId_libraryId: { userId, libraryId: targetLibraryId },
      },
    });

    if (existing) {
      throw new BadRequestException('Foydalanuvchi allaqachon bu kutubxonaga biriktirilgan');
    }

    return this.prisma.userLibrary.create({
      data: { userId, libraryId: targetLibraryId },
    });
  }

  // === Passport ===

  async createPassport(dto: { passportId: string; pinfl?: string; image?: string; userId: number }) {
    const existingPassport = await this.prisma.passport.findUnique({
      where: { passportId: dto.passportId.toUpperCase() },
    });
    if (existingPassport) {
      throw new BadRequestException('Bu passport raqami allaqachon bazada mavjud');
    }

    if (dto.pinfl) {
      const existingPinfl = await this.prisma.passport.findFirst({
        where: { pinfl: dto.pinfl, userId: { not: dto.userId } },
      });
      if (existingPinfl) {
        throw new BadRequestException('Bu PINFL allaqachon boshqa foydalanuvchiga tegishli');
      }
    }

    return this.prisma.passport.create({
      data: {
        passportId: dto.passportId.toUpperCase(),
        pinfl: dto.pinfl,
        image: dto.image,
        userId: dto.userId,
      },
    });
  }
}
