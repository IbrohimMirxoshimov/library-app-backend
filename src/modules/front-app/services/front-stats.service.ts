import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';

@Injectable()
export class FrontStatsService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  async getPublicStats() {
    const cacheKey = 'front:stats:public';
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const [totalBooks, totalUsers, totalRentals, activeRentals] =
      await Promise.all([
        this.prisma.book.count({ where: { deletedAt: null } }),
        this.prisma.user.count({ where: { deletedAt: null } }),
        this.prisma.rental.count({ where: { deletedAt: null, rejected: false } }),
        this.prisma.rental.count({
          where: { deletedAt: null, returnedAt: null, rejected: false },
        }),
      ]);

    const result = { totalBooks, totalUsers, totalRentals, activeRentals };

    // Cache for 1 hour
    await this.redis.set(cacheKey, JSON.stringify(result), 'EX', 3600);
    return result;
  }

  async getStatsByRange(startDate: string, endDate: string) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const [newRentals, completedRentals, newUsers] = await Promise.all([
      this.prisma.rental.count({
        where: {
          createdAt: { gte: start, lte: end },
          deletedAt: null,
          rejected: false,
        },
      }),
      this.prisma.rental.count({
        where: {
          returnedAt: { gte: start, lte: end },
          deletedAt: null,
          rejected: false,
        },
      }),
      this.prisma.user.count({
        where: { createdAt: { gte: start, lte: end }, deletedAt: null },
      }),
    ]);

    return { startDate, endDate, newRentals, completedRentals, newUsers };
  }
}
