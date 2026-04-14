import { Controller, Get, Post, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { PrismaService } from '../../prisma/prisma.service';
import { Public } from '../../../common/decorators/public.decorator';
import { ExpiredRentalInfoDto } from '../dto/expired-rental-info.dto';
import { normalizePhone } from '../../../common/utils/phone.utils';

@ApiTags('app')
@Controller('app')
export class FrontOtherController {
  constructor(private prisma: PrismaService) {}

  @Get('collections')
  @Public()
  @ApiOperation({ summary: 'List collections' })
  async getCollections() {
    return this.prisma.collection.findMany({
      where: { deletedAt: null },
      orderBy: { sort: 'asc' },
    });
  }

  @Get('libraries')
  @Public()
  @ApiOperation({ summary: 'List active libraries' })
  async getLibraries() {
    return this.prisma.library.findMany({
      where: { active: true, deletedAt: null },
      include: { address: { include: { region: true } } },
      orderBy: { name: 'asc' },
    });
  }

  @Get('users/telegram/:telegramId')
  @ApiOperation({ summary: 'Find user by Telegram ID' })
  async findByTelegram(@Param('telegramId') telegramId: string) {
    const user = await this.prisma.user.findUnique({
      where: { telegramId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        verified: true,
        status: true,
        libraries: { include: { library: { select: { id: true, name: true } } } },
      },
    });
    return user ?? { found: false };
  }

  @Post('expired-rental-info')
  @Public()
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 3600000 } })
  @ApiOperation({ summary: 'Check expired rentals by phone (rate limited: 5/hour)' })
  async expiredRentalInfo(@Body() dto: ExpiredRentalInfoDto) {
    const phone = normalizePhone(dto.phone);
    if (!phone) return { rentals: [] };

    const user = await this.prisma.user.findFirst({
      where: { phone, deletedAt: null },
    });
    if (!user) return { rentals: [] };

    const rentals = await this.prisma.rental.findMany({
      where: {
        readerId: user.id,
        returnedAt: null,
        rejected: false,
        deletedAt: null,
        dueDate: { lt: new Date() },
      },
      include: {
        stock: { include: { book: { select: { name: true } } } },
        library: { select: { name: true } },
      },
      orderBy: { dueDate: 'asc' },
    });

    return {
      rentals: rentals.map((r) => ({
        bookName: r.stock.book.name,
        libraryName: r.library.name,
        dueDate: r.dueDate,
        issuedAt: r.issuedAt,
      })),
    };
  }
}
