import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRentalDto } from './dto/create-rental.dto';
import { ReturnRentalDto } from './dto/return-rental.dto';
import { RejectRentalDto } from './dto/reject-rental.dto';
import { EditRentalDto } from './dto/edit-rental.dto';
import { QueryRentalDto } from './dto/query-rental.dto';
import { PaginatedResponse } from '../../common/dto/paginated-response.dto';
import { RequestUser } from '../../common/interfaces/request-user.interface';
import { addWorkingDays, daysBetween } from '../../common/utils/date.utils';
import { RENTAL_STRATEGY, AUTO_BLOCK_DAYS_SINCE_ISSUED, AUTO_BLOCK_DAYS_PAST_DUE } from '../../constants/rental';
import { Prisma, BookRarity } from '@prisma/client';

export interface RentalCheckResult {
  eligible: boolean;
  reason?: string;
  dueDate?: Date;
  issuedAt?: Date;
}

@Injectable()
export class RentalService {
  private readonly logger = new Logger(RentalService.name);

  constructor(private prisma: PrismaService) {}

  async findAll(query: QueryRentalDto, user: RequestUser) {
    const where: Prisma.RentalWhereInput = { deletedAt: null };

    if (query.ids?.length) {
      where.id = { in: query.ids };
    }

    // Library scoping
    if (user.roleName !== 'owner' && user.adminLibraryId) {
      where.libraryId = user.adminLibraryId;
    }

    if (query.libraryId) where.libraryId = query.libraryId;
    if (query.readerId) where.readerId = query.readerId;
    if (query.active) where.returnedAt = null;
    if (query.rejected !== undefined) where.rejected = query.rejected;

    // Multi-purpose search: i=rentId, c=referenceId, u=userId, s=stockId, b=bookId, p=phone, text=name
    if (query.q) {
      const q = query.q;
      const prefixMatch = q.match(/^([icusbp])(\d+)$/);
      if (prefixMatch) {
        const [, prefix, val] = prefixMatch;
        const numVal = parseInt(val, 10);
        switch (prefix) {
          case 'i': where.id = numVal; break;
          case 'c': where.referenceId = val; break;
          case 'u': where.readerId = numVal; break;
          case 's': where.stockId = numVal; break;
          case 'b': where.stock = { bookId: numVal }; break;
          case 'p': where.reader = { phone: { contains: val } }; break;
        }
      } else {
        // Ism/familiya bo'yicha qidirish
        where.reader = {
          OR: [
            { firstName: { contains: q, mode: 'insensitive' } },
            { lastName: { contains: q, mode: 'insensitive' } },
            { phone: { contains: q } },
          ],
        };
      }
    }

    const page = query.page ?? 1;
    const size = query.size ?? 20;

    const items = await this.prisma.rental.findMany({
      where,
      skip: (page - 1) * size,
      take: size,
      orderBy: { [query.sort ?? 'createdAt']: query.order ?? 'desc' },
      include: {
        reader: { select: { id: true, firstName: true, lastName: true, phone: true } },
        stock: { include: { book: { include: { authors: { include: { author: true } } } } } },
        issuedBy: { select: { id: true, firstName: true, lastName: true } },
        returnedBy: { select: { id: true, firstName: true, lastName: true } },
        library: true,
      },
    });

    const total = query.ids?.length ? items.length : await this.prisma.rental.count({ where });

    return new PaginatedResponse(items, page, size, total);
  }

  async findOne(id: number, user: RequestUser) {
    const where: Prisma.RentalWhereInput = { id, deletedAt: null };
    if (user.roleName !== 'owner' && user.adminLibraryId) {
      where.libraryId = user.adminLibraryId;
    }

    const rental = await this.prisma.rental.findFirst({
      where,
      include: {
        reader: { select: { id: true, firstName: true, lastName: true, phone: true, status: true, verified: true, balance: true } },
        stock: { include: { book: { include: { authors: { include: { author: true } } } }, bookRule: true } },
        issuedBy: { select: { id: true, firstName: true, lastName: true } },
        returnedBy: { select: { id: true, firstName: true, lastName: true } },
        library: true,
        comments: { include: { author: { select: { id: true, firstName: true, lastName: true } } } },
      },
    });

    if (!rental) throw new NotFoundException('Ijara topilmadi');
    return rental;
  }

  /**
   * Pre-validate rental eligibility without creating.
   */
  async check(dto: CreateRentalDto, user: RequestUser): Promise<RentalCheckResult> {
    return this.validateRental(dto, user);
  }

  /**
   * Create a new rental with full eligibility validation.
   */
  async create(dto: CreateRentalDto, user: RequestUser) {
    const validation = await this.validateRental(dto, user);

    if (!validation.eligible) {
      throw new BadRequestException(validation.reason);
    }

    return this.prisma.$transaction(async (tx) => {
      const rental = await tx.rental.create({
        data: {
          readerId: dto.readerId,
          stockId: dto.stockId,
          libraryId: (await tx.stock.findUniqueOrThrow({ where: { id: dto.stockId } })).libraryId,
          issuedAt: validation.issuedAt!,
          dueDate: validation.dueDate!,
          issuedById: user.id,
          referenceId: dto.referenceId,
        },
        include: {
          reader: { select: { id: true, firstName: true, lastName: true } },
          stock: { include: { book: true } },
          library: true,
        },
      });

      // Mark stock as busy
      await tx.stock.update({
        where: { id: dto.stockId },
        data: { busy: true },
      });

      this.logger.log(`Rental created: rental=${rental.id} reader=${dto.readerId} stock=${dto.stockId}`);
      return rental;
    });
  }

  /**
   * Return a rented book.
   */
  async returnBook(id: number, dto: ReturnRentalDto, user: RequestUser) {
    const rental = await this.findOne(id, user);

    if (rental.returnedAt) {
      throw new BadRequestException('Bu kitob allaqachon qaytarilgan');
    }
    if (rental.rejected) {
      throw new BadRequestException('Bu ijara rad etilgan');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.rental.update({
        where: { id },
        data: {
          returnedAt: new Date(),
          returnedById: user.id,
          note: dto.note || rental.note,
        },
      });

      // Mark stock as available
      await tx.stock.update({
        where: { id: rental.stockId },
        data: { busy: false },
      });

      return updated;
    });

    // Check auto-blocking conditions
    await this.checkAutoBlock(rental.readerId, rental.issuedAt, rental.dueDate);

    this.logger.log(`Rental returned: rental=${id} reader=${rental.readerId}`);
    return result;
  }

  /**
   * Reject a rental with mandatory reason and stock status change.
   */
  async reject(id: number, dto: RejectRentalDto, user: RequestUser) {
    const rental = await this.findOne(id, user);

    if (rental.returnedAt) {
      throw new BadRequestException('Qaytarilgan ijarani rad etib bo\'lmaydi');
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.rental.update({
        where: { id },
        data: {
          rejected: true,
          note: dto.note,
        },
      });

      // Change stock status (not busy, but with new status like DAMAGED, LOST, etc.)
      await tx.stock.update({
        where: { id: rental.stockId },
        data: { status: dto.stockStatus, busy: true },
      });

      this.logger.log(`Rental rejected: rental=${id} reason="${dto.note}"`);
      return updated;
    });
  }

  /**
   * Edit rental dueDate with comment logging.
   */
  async edit(id: number, dto: EditRentalDto, user: RequestUser) {
    const rental = await this.findOne(id, user);

    if (rental.returnedAt) {
      throw new BadRequestException('Qaytarilgan ijarani tahrirlash mumkin emas');
    }

    const newDueDate = new Date(dto.dueDate);
    const now = new Date();

    // dueDate hozirdan 60 kundan oshmasligi kerak
    const maxDueDate = new Date(now);
    maxDueDate.setDate(maxDueDate.getDate() + 60);
    if (newDueDate > maxDueDate) {
      throw new BadRequestException('Qaytarish muddati hozirdan 60 kundan oshib ketdi');
    }

    // dueDate issuedAt dan oldin bo'lishi mumkin emas
    if (newDueDate <= rental.issuedAt) {
      throw new BadRequestException('Qaytarish muddati berilgan sanadan oldin bo\'lishi mumkin emas');
    }

    const updated = await this.prisma.rental.update({
      where: { id },
      data: { dueDate: newDueDate },
    });

    // Log the change as a comment
    if (dto.note) {
      await this.prisma.comment.create({
        data: {
          text: `Muddat o'zgartirildi: ${dto.note}`,
          rentalId: id,
          authorId: user.id,
        },
      });
    }

    return updated;
  }

  /**
   * Expired rentals report.
   */
  async report(query: QueryRentalDto, user: RequestUser) {
    const where: Prisma.RentalWhereInput = {
      deletedAt: null,
      returnedAt: null,
      rejected: false,
      dueDate: { lt: new Date() },
    };

    if (user.roleName !== 'owner' && user.adminLibraryId) {
      where.libraryId = user.adminLibraryId;
    }
    if (query.libraryId) where.libraryId = query.libraryId;
    if (query.readerId) where.readerId = query.readerId;

    const [items, total] = await Promise.all([
      this.prisma.rental.findMany({
        where,
        skip: ((query.page ?? 1) - 1) * (query.size ?? 20),
        take: query.size ?? 20,
        orderBy: { dueDate: 'asc' },
        include: {
          reader: { select: { id: true, firstName: true, lastName: true, phone: true, status: true } },
          stock: { include: { book: true } },
          library: true,
        },
      }),
      this.prisma.rental.count({ where }),
    ]);

    return new PaginatedResponse(items, query.page ?? 1, query.size ?? 20, total);
  }

  // ============================================================
  // Private business logic
  // ============================================================

  private async validateRental(dto: CreateRentalDto, user: RequestUser): Promise<RentalCheckResult> {
    // Owner barcha kutubxonaga ruxsat, boshqalar faqat o'z kutubxonasi
    const stockWhere: Prisma.StockWhereInput = { id: dto.stockId, deletedAt: null };
    if (user.roleName !== 'owner') {
      if (!user.adminLibraryId) {
        return { eligible: false, reason: 'Admin kutubxonasi aniqlanmadi' };
      }
      stockWhere.libraryId = user.adminLibraryId;
    }

    const stock = await this.prisma.stock.findFirst({
      where: stockWhere,
      include: { bookRule: true, library: true, book: true },
    });

    if (!stock) return { eligible: false, reason: 'Stock topilmadi yoki sizning kutubxonangizga tegishli emas' };
    if (stock.busy) return { eligible: false, reason: 'Bu kitob band' };
    if (stock.status !== 'ACTIVE') return { eligible: false, reason: 'Bu stock aktiv emas' };

    // Load reader — shu kutubxonaga a'zo bo'lishi kerak
    const reader = await this.prisma.user.findFirst({
      where: { id: dto.readerId, deletedAt: null },
    });

    if (!reader) return { eligible: false, reason: 'Foydalanuvchi topilmadi' };

    // Reader shu kutubxonaga a'zo ekanligini tekshirish
    const membership = await this.prisma.userLibrary.findUnique({
      where: { userId_libraryId: { userId: dto.readerId, libraryId: stock.libraryId } },
    });
    if (!membership) {
      return { eligible: false, reason: 'Foydalanuvchi bu kutubxonaga a\'zo emas' };
    }

    // Check if blocked (blocked users can rent if they have enough balance)
    if (reader.status === 'BLOCKED') {
      const price = stock.bookRule?.price ?? 50000;
      if (reader.balance < price) {
        return { eligible: false, reason: 'Foydalanuvchi bloklangan va balansi yetarli emas' };
      }
    }

    // Check for rejected rentals
    const hasRejected = await this.prisma.rental.count({
      where: {
        readerId: dto.readerId,
        libraryId: stock.libraryId,
        rejected: true,
        returnedAt: null,
        deletedAt: null,
      },
    });
    if (hasRejected > 0) {
      return { eligible: false, reason: 'Foydalanuvchining rad etilgan ijarasi bor' };
    }

    // Check rental strategy limit
    const [activeCount, completedCount] = await Promise.all([
      this.prisma.rental.count({
        where: {
          readerId: dto.readerId,
          libraryId: stock.libraryId,
          returnedAt: null,
          rejected: false,
          deletedAt: null,
        },
      }),
      this.prisma.rental.count({
        where: {
          readerId: dto.readerId,
          libraryId: stock.libraryId,
          returnedAt: { not: null },
          rejected: false,
          deletedAt: null,
        },
      }),
    ]);

    const maxActive = this.getMaxActiveRentals(completedCount);
    if (activeCount >= maxActive) {
      return { eligible: false, reason: `Maksimal aktiv ijaralar soni (${maxActive}) ga yetgan` };
    }

    // Rarity check
    const rarity = stock.bookRule?.rarity ?? 'COMMON';
    const rarityResult = await this.checkRarity(
      rarity,
      dto.readerId,
      stock.libraryId,
      stock.bookId,
      reader.verified,
      activeCount,
      completedCount,
    );
    if (!rarityResult.eligible) {
      return rarityResult;
    }

    // Check zarur blocking
    const zarurResult = await this.checkZarurBlocking(
      dto.readerId,
      stock.libraryId,
      rarity,
      stock.bookId,
      reader.verified,
      activeCount,
    );
    if (!zarurResult.eligible) {
      return zarurResult;
    }

    // Validate issuedAt — max 1 yil oldin, kelajak bo'lishi mumkin emas
    const now = new Date();
    const issuedAt = dto.issuedAt ? new Date(dto.issuedAt) : now;
    const oneYearAgo = new Date(now);
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    if (issuedAt > now) {
      return { eligible: false, reason: 'Berilgan sana kelajakda bo\'lishi mumkin emas' };
    }
    if (issuedAt < oneYearAgo) {
      return { eligible: false, reason: 'Berilgan sana 1 yildan eski bo\'lishi mumkin emas' };
    }

    // Calculate due date
    const rentDuration = stock.bookRule?.rentDuration ?? 15;
    const schedule = stock.library.schedule ?? null;
    const dueDate = addWorkingDays(issuedAt, rentDuration, schedule);

    // Validate dueDate — max 60 kun kelajakda
    const maxDueDate = new Date(now);
    maxDueDate.setDate(maxDueDate.getDate() + 60);
    if (dueDate > maxDueDate) {
      return { eligible: false, reason: 'Qaytarish muddati hozirdan 60 kundan oshib ketdi' };
    }

    return { eligible: true, dueDate, issuedAt };
  }

  private getMaxActiveRentals(completedCount: number): number {
    for (const tier of RENTAL_STRATEGY) {
      if (completedCount >= tier.completedMin) {
        return tier.maxActive;
      }
    }
    return 1;
  }

  private async checkRarity(
    rarity: BookRarity,
    readerId: number,
    libraryId: number,
    bookId: number,
    verified: boolean,
    activeCount: number,
    completedCount: number,
  ): Promise<RentalCheckResult> {
    if (rarity === 'COMMON') {
      // SQRT auto-detection
      const isZarur = await this.isSqrtZarur(bookId, libraryId);
      if (isZarur) {
        // Treat as UNCOMMON
        if (!verified) return { eligible: false, reason: 'Kamyob kitob — tasdiqlangan foydalanuvchi kerak' };
        if (activeCount >= 5) return { eligible: false, reason: 'Kamyob kitob — 5 dan kam aktiv ijara kerak' };
      }
      return { eligible: true };
    }

    if (rarity === 'UNCOMMON') {
      if (!verified) return { eligible: false, reason: 'Kamyob kitob — tasdiqlangan foydalanuvchi kerak' };
      if (activeCount >= 5) return { eligible: false, reason: 'Kamyob kitob — 5 dan kam aktiv ijara kerak' };
      return { eligible: true };
    }

    if (rarity === 'RARE') {
      if (!verified) return { eligible: false, reason: 'Noyob kitob — tasdiqlangan foydalanuvchi kerak' };
      if (completedCount < 10) return { eligible: false, reason: 'Noyob kitob — kamida 10 ta tugallangan ijara kerak' };
      const rareActive = await this.prisma.rental.count({
        where: {
          readerId,
          libraryId,
          returnedAt: null,
          rejected: false,
          deletedAt: null,
          stock: { bookRule: { rarity: 'RARE' } },
        },
      });
      if (rareActive >= 1) return { eligible: false, reason: 'Faqat 1 ta noyob kitob olish mumkin' };
      return { eligible: true };
    }

    if (rarity === 'RESTRICTED') {
      if (!verified) return { eligible: false, reason: 'Cheklangan kitob — tasdiqlangan foydalanuvchi kerak' };
      if (completedCount < 50) return { eligible: false, reason: 'Cheklangan kitob — kamida 50 ta tugallangan ijara kerak' };
      const restrictedActive = await this.prisma.rental.count({
        where: {
          readerId,
          libraryId,
          returnedAt: null,
          rejected: false,
          deletedAt: null,
          stock: { bookRule: { rarity: 'RESTRICTED' } },
        },
      });
      if (restrictedActive >= 1) return { eligible: false, reason: 'Faqat 1 ta cheklangan kitob olish mumkin' };
      return { eligible: true };
    }

    return { eligible: true };
  }

  /**
   * SQRT auto-detection: available < sqrt(total) for COMMON books
   */
  private async isSqrtZarur(bookId: number, libraryId: number): Promise<boolean> {
    const totalStocks = await this.prisma.stock.count({
      where: { bookId, libraryId, status: 'ACTIVE', deletedAt: null },
    });

    if (totalStocks === 0) return false;

    const busyStocks = await this.prisma.stock.count({
      where: { bookId, libraryId, status: 'ACTIVE', busy: true, deletedAt: null },
    });

    const available = totalStocks - busyStocks;
    return available < Math.sqrt(totalStocks);
  }

  /**
   * Zarur blocking: reader holding a zarur book cannot take another zarur book.
   */
  private async checkZarurBlocking(
    readerId: number,
    libraryId: number,
    requestedRarity: BookRarity,
    requestedBookId: number,
    verified: boolean,
    activeCount: number,
  ): Promise<RentalCheckResult> {
    // Check if user currently holds any zarur book
    const activeRentals = await this.prisma.rental.findMany({
      where: {
        readerId,
        libraryId,
        returnedAt: null,
        rejected: false,
        deletedAt: null,
      },
      include: {
        stock: { include: { bookRule: true } },
      },
    });

    let holdsZarur = false;
    for (const rental of activeRentals) {
      const rentalRarity = rental.stock.bookRule?.rarity ?? 'COMMON';
      if (rentalRarity !== 'COMMON') {
        // UNCOMMON, RARE, RESTRICTED are always zarur
        holdsZarur = true;
        break;
      }
      // Check SQRT for COMMON
      const isZarur = await this.isSqrtZarur(rental.stock.bookId, libraryId);
      if (isZarur) {
        holdsZarur = true;
        break;
      }
    }

    if (!holdsZarur) return { eligible: true };

    // User holds zarur → restrictions apply
    if (!verified || activeCount >= 5) {
      return { eligible: false, reason: 'Zarur kitob bor — yangi kitob olish uchun tasdiqlangan va 5 dan kam aktiv ijara kerak' };
    }

    // Check if requested book is also zarur
    const requestedIsZarur =
      requestedRarity !== 'COMMON' ||
      (await this.isSqrtZarur(requestedBookId, libraryId));

    if (requestedIsZarur) {
      return { eligible: false, reason: 'Bir vaqtda 2 ta zarur kitob olish mumkin emas' };
    }

    return { eligible: true };
  }

  /**
   * Check auto-blocking conditions after return.
   */
  private async checkAutoBlock(readerId: number, issuedAt: Date, dueDate: Date): Promise<void> {
    const now = new Date();
    const daysSinceIssued = daysBetween(issuedAt, now);
    const daysPastDue = daysBetween(dueDate, now);

    const shouldBlock =
      daysSinceIssued >= AUTO_BLOCK_DAYS_SINCE_ISSUED ||
      daysPastDue >= AUTO_BLOCK_DAYS_PAST_DUE;

    if (shouldBlock) {
      const reason =
        daysSinceIssued >= AUTO_BLOCK_DAYS_SINCE_ISSUED
          ? `Kitob ${daysSinceIssued} kun ushlab turildi (limit: ${AUTO_BLOCK_DAYS_SINCE_ISSUED})`
          : `Kitob muddatidan ${daysPastDue} kun kech qaytarildi (limit: ${AUTO_BLOCK_DAYS_PAST_DUE})`;

      await this.prisma.user.update({
        where: { id: readerId },
        data: { status: 'BLOCKED', blockingReason: reason },
      });

      this.logger.warn(`User ${readerId} auto-blocked: ${reason}`);
    }
  }
}
