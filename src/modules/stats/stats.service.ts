import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { RequestUser } from '../../common/interfaces/request-user.interface';

/** Cache TTL for stats — 1 hour in seconds */
const STATS_CACHE_TTL = 3600;

/** Redis key prefix for stats cache */
const STATS_KEY_PREFIX = 'stats:';

export interface TopReader {
  id: number;
  firstName: string;
  lastName: string;
  phone: string | null;
  completedCount: number;
}

interface TopBook {
  id: number;
  name: string;
  rentalCount: number;
}

interface GenderBreakdown {
  male: number;
  female: number;
  unknown: number;
}

interface FewBook {
  bookId: number;
  bookName: string;
  libraryId: number;
  totalCopies: number;
  availableCopies: number;
  sqrtThreshold: number;
}

interface RentalCounts {
  daily: number;
  weekly: number;
  monthly: number;
}

export interface StatsResponse {
  totalBooks: number;
  totalUsers: number;
  totalStocks: number;
  activeRentals: number;
  completedRentals: number;
  topReaders: TopReader[];
  topBooks: TopBook[];
  genderBreakdown: GenderBreakdown;
  fewBooks: FewBook[];
  rentalCounts: RentalCounts;
}

@Injectable()
export class StatsService {
  private readonly logger = new Logger(StatsService.name);

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  /**
   * Get admin stats for a library (or all libraries for owner).
   * Results are cached in Redis for 1 hour per library.
   */
  async getStats(user: RequestUser): Promise<StatsResponse> {
    const libraryId = user.roleName === 'owner' ? null : user.adminLibraryId;
    const cacheKey = `${STATS_KEY_PREFIX}${libraryId ?? 'all'}`;

    // Try cache first
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      this.logger.debug(`Stats cache hit for key: ${cacheKey}`);
      return JSON.parse(cached) as StatsResponse;
    }

    this.logger.debug(`Stats cache miss for key: ${cacheKey}, computing...`);

    const stats = await this.computeStats(libraryId);

    // Store in cache
    await this.redis.set(cacheKey, JSON.stringify(stats), 'EX', STATS_CACHE_TTL);

    return stats;
  }

  /**
   * Compute all stats from database.
   * Uses parallel queries where possible for performance.
   */
  private async computeStats(libraryId: number | null): Promise<StatsResponse> {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfDay);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Library filter for stock/rental queries
    const libraryFilter = libraryId ? { libraryId } : {};

    const [
      totalBooks,
      totalUsers,
      totalStocks,
      activeRentals,
      completedRentals,
      topReaders,
      topBooks,
      genderBreakdown,
      fewBooks,
      dailyRentals,
      weeklyRentals,
      monthlyRentals,
    ] = await Promise.all([
      // Total books (non-deleted)
      this.prisma.book.count({ where: { deletedAt: null } }),

      // Total users (non-deleted) scoped to library if needed
      libraryId
        ? this.prisma.userLibrary.count({ where: { libraryId } })
        : this.prisma.user.count({ where: { deletedAt: null } }),

      // Total stocks (non-deleted, scoped to library)
      this.prisma.stock.count({
        where: { deletedAt: null, ...libraryFilter },
      }),

      // Active rentals (not returned, not rejected, not deleted)
      this.prisma.rental.count({
        where: {
          returnedAt: null,
          rejected: false,
          deletedAt: null,
          ...libraryFilter,
        },
      }),

      // Completed rentals (returned, not rejected, not deleted)
      this.prisma.rental.count({
        where: {
          returnedAt: { not: null },
          rejected: false,
          deletedAt: null,
          ...libraryFilter,
        },
      }),

      // Top 10 readers by completed rental count
      this.getTopReaders(libraryId),

      // Top 10 books by rental count
      this.getTopBooks(libraryId),

      // Gender breakdown of users
      this.getGenderBreakdown(libraryId),

      // Few books list (SQRT detection)
      this.getFewBooks(libraryId),

      // Daily rental count
      this.prisma.rental.count({
        where: {
          issuedAt: { gte: startOfDay },
          rejected: false,
          deletedAt: null,
          ...libraryFilter,
        },
      }),

      // Weekly rental count
      this.prisma.rental.count({
        where: {
          issuedAt: { gte: startOfWeek },
          rejected: false,
          deletedAt: null,
          ...libraryFilter,
        },
      }),

      // Monthly rental count
      this.prisma.rental.count({
        where: {
          issuedAt: { gte: startOfMonth },
          rejected: false,
          deletedAt: null,
          ...libraryFilter,
        },
      }),
    ]);

    return {
      totalBooks,
      totalUsers,
      totalStocks,
      activeRentals,
      completedRentals,
      topReaders,
      topBooks,
      genderBreakdown,
      fewBooks,
      rentalCounts: {
        daily: dailyRentals,
        weekly: weeklyRentals,
        monthly: monthlyRentals,
      },
    };
  }

  /**
   * Top 10 readers by completed (returned, non-rejected) rental count.
   */
  private async getTopReaders(libraryId: number | null): Promise<TopReader[]> {
    const libraryFilter = libraryId ? { libraryId } : {};

    const readers = await this.prisma.rental.groupBy({
      by: ['readerId'],
      where: {
        returnedAt: { not: null },
        rejected: false,
        deletedAt: null,
        ...libraryFilter,
      },
      _count: { readerId: true },
      orderBy: { _count: { readerId: 'desc' } },
      take: 10,
    });

    if (readers.length === 0) return [];

    // Fetch user details for top readers
    const userIds = readers.map((r) => r.readerId);
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, firstName: true, lastName: true, phone: true },
    });

    const userMap = new Map(users.map((u) => [u.id, u]));

    return readers
      .map((r) => {
        const user = userMap.get(r.readerId);
        if (!user) return null;
        return {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          completedCount: r._count.readerId,
        };
      })
      .filter((r): r is TopReader => r !== null);
  }

  /**
   * Top 10 books by total rental count (non-rejected, non-deleted).
   */
  private async getTopBooks(libraryId: number | null): Promise<TopBook[]> {
    const libraryFilter = libraryId ? { libraryId } : {};

    // Group rentals by stockId, then aggregate by bookId
    const stockRentals = await this.prisma.rental.groupBy({
      by: ['stockId'],
      where: {
        rejected: false,
        deletedAt: null,
        ...libraryFilter,
      },
      _count: { stockId: true },
    });

    if (stockRentals.length === 0) return [];

    // Get stock -> bookId mapping
    const stockIds = stockRentals.map((r) => r.stockId);
    const stocks = await this.prisma.stock.findMany({
      where: { id: { in: stockIds } },
      select: { id: true, bookId: true },
    });

    const stockBookMap = new Map(stocks.map((s) => [s.id, s.bookId]));

    // Aggregate by bookId
    const bookCounts = new Map<number, number>();
    for (const rental of stockRentals) {
      const bookId = stockBookMap.get(rental.stockId);
      if (bookId !== undefined) {
        bookCounts.set(bookId, (bookCounts.get(bookId) ?? 0) + rental._count.stockId);
      }
    }

    // Sort and take top 10
    const sortedBooks = [...bookCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    if (sortedBooks.length === 0) return [];

    // Fetch book names
    const bookIds = sortedBooks.map(([id]) => id);
    const books = await this.prisma.book.findMany({
      where: { id: { in: bookIds } },
      select: { id: true, name: true },
    });

    const bookMap = new Map(books.map((b) => [b.id, b.name]));

    return sortedBooks
      .map(([bookId, count]) => ({
        id: bookId,
        name: bookMap.get(bookId) ?? 'Unknown',
        rentalCount: count,
      }));
  }

  /**
   * Gender breakdown of users belonging to the library.
   */
  private async getGenderBreakdown(libraryId: number | null): Promise<GenderBreakdown> {
    if (libraryId) {
      // For library-scoped: count via UserLibrary join
      const [male, female, total] = await Promise.all([
        this.prisma.userLibrary.count({
          where: { libraryId, user: { gender: 'MALE', deletedAt: null } },
        }),
        this.prisma.userLibrary.count({
          where: { libraryId, user: { gender: 'FEMALE', deletedAt: null } },
        }),
        this.prisma.userLibrary.count({
          where: { libraryId, user: { deletedAt: null } },
        }),
      ]);

      return { male, female, unknown: total - male - female };
    }

    // For owner (all libraries)
    const [male, female, total] = await Promise.all([
      this.prisma.user.count({ where: { gender: 'MALE', deletedAt: null } }),
      this.prisma.user.count({ where: { gender: 'FEMALE', deletedAt: null } }),
      this.prisma.user.count({ where: { deletedAt: null } }),
    ]);

    return { male, female, unknown: total - male - female };
  }

  /**
   * Find books where available stock < SQRT(total stock).
   * This is the SQRT auto-detection for "zarur" (required/scarce) books.
   * Only applies to COMMON rarity books.
   */
  private async getFewBooks(libraryId: number | null): Promise<FewBook[]> {
    const libraryFilter = libraryId ? { libraryId } : {};

    // 1. UNCOMMON+ kitoblar (qo'lda belgilangan) — har doim zarur
    const uncommonStocks = await this.prisma.stock.groupBy({
      by: ['bookId', 'libraryId'],
      where: {
        deletedAt: null,
        status: 'ACTIVE',
        ...libraryFilter,
        bookRule: { rarity: { not: 'COMMON' } },
      },
      _count: { id: true },
    });

    const uncommonBusy = await this.prisma.stock.groupBy({
      by: ['bookId', 'libraryId'],
      where: {
        deletedAt: null,
        status: 'ACTIVE',
        busy: true,
        ...libraryFilter,
        bookRule: { rarity: { not: 'COMMON' } },
      },
      _count: { id: true },
    });

    // 2. COMMON kitoblar — SQRT tekshiruvi (total > 1 shart)
    const commonStocks = await this.prisma.stock.groupBy({
      by: ['bookId', 'libraryId'],
      where: {
        deletedAt: null,
        status: 'ACTIVE',
        ...libraryFilter,
        OR: [
          { bookRule: { rarity: 'COMMON' } },
          { bookRuleId: null },
        ],
      },
      _count: { id: true },
    });

    const commonBusy = await this.prisma.stock.groupBy({
      by: ['bookId', 'libraryId'],
      where: {
        deletedAt: null,
        status: 'ACTIVE',
        busy: true,
        ...libraryFilter,
        OR: [
          { bookRule: { rarity: 'COMMON' } },
          { bookRuleId: null },
        ],
      },
      _count: { id: true },
    });

    const busyMap = new Map<string, number>();
    for (const g of [...uncommonBusy, ...commonBusy]) {
      busyMap.set(`${g.bookId}-${g.libraryId}`, g._count.id);
    }

    const fewBooks: FewBook[] = [];
    const bookIds = new Set<number>();

    // UNCOMMON+ — hammasi zarur
    for (const g of uncommonStocks) {
      const total = g._count.id;
      const busy = busyMap.get(`${g.bookId}-${g.libraryId}`) ?? 0;
      bookIds.add(g.bookId);
      fewBooks.push({
        bookId: g.bookId,
        bookName: '',
        libraryId: g.libraryId,
        totalCopies: total,
        availableCopies: total - busy,
        sqrtThreshold: 0,
      });
    }

    // COMMON — faqat total > 1 va available < sqrt(total)
    const uncommonKeys = new Set(uncommonStocks.map((g) => `${g.bookId}-${g.libraryId}`));
    for (const g of commonStocks) {
      const key = `${g.bookId}-${g.libraryId}`;
      if (uncommonKeys.has(key)) continue;
      const total = g._count.id;
      if (total <= 1) continue;
      const busy = busyMap.get(key) ?? 0;
      const available = total - busy;
      const sqrtVal = Math.sqrt(total);
      if (available < sqrtVal) {
        bookIds.add(g.bookId);
        fewBooks.push({
          bookId: g.bookId,
          bookName: '',
          libraryId: g.libraryId,
          totalCopies: total,
          availableCopies: available,
          sqrtThreshold: Math.ceil(sqrtVal),
        });
      }
    }

    // Kitob nomlarini olish
    if (bookIds.size > 0) {
      const books = await this.prisma.book.findMany({
        where: { id: { in: [...bookIds] } },
        select: { id: true, name: true },
      });
      const bookMap = new Map(books.map((b) => [b.id, b.name]));
      for (const item of fewBooks) {
        item.bookName = bookMap.get(item.bookId) ?? 'Unknown';
      }
    }

    return fewBooks.sort((a, b) => b.totalCopies - a.totalCopies).slice(0, 100);
  }
}
