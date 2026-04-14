import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import {
  AUTO_BLOCK_DAYS_SINCE_ISSUED,
  AUTO_BLOCK_DAYS_PAST_DUE,
} from '../../../constants/rental';

/**
 * Daily cron job to automatically block users with overdue rentals.
 *
 * Runs at midnight every day (0 0 * * *).
 *
 * Blocking rules (70d/10d):
 * - 70 days past issuedAt: user held the book far too long
 * - 10 days past dueDate: user is significantly overdue
 *
 * Both conditions check against active rentals (not returned, not rejected).
 */
@Injectable()
export class AutoBlockCron {
  private readonly logger = new Logger(AutoBlockCron.name);

  constructor(private prisma: PrismaService) {}

  @Cron('0 0 * * *', { name: 'autoBlockOverdue' })
  async handleAutoBlock(): Promise<void> {
    this.logger.log('Starting auto-block cron job...');

    const now = new Date();

    // 70 days ago from now
    const issuedAtThreshold = new Date(now);
    issuedAtThreshold.setDate(issuedAtThreshold.getDate() - AUTO_BLOCK_DAYS_SINCE_ISSUED);

    // 10 days ago from now (for dueDate comparison)
    const dueDateThreshold = new Date(now);
    dueDateThreshold.setDate(dueDateThreshold.getDate() - AUTO_BLOCK_DAYS_PAST_DUE);

    try {
      // Find active rentals that exceed either threshold
      const overdueRentals = await this.prisma.rental.findMany({
        where: {
          returnedAt: null,
          rejected: false,
          deletedAt: null,
          OR: [
            { issuedAt: { lte: issuedAtThreshold } },
            { dueDate: { lte: dueDateThreshold } },
          ],
        },
        select: {
          id: true,
          readerId: true,
          issuedAt: true,
          dueDate: true,
        },
      });

      if (overdueRentals.length === 0) {
        this.logger.log('No overdue rentals found — no users to block');
        return;
      }

      // Get unique user IDs to block
      const userIdsToBlock = [...new Set(overdueRentals.map((r) => r.readerId))];

      // Block users who are currently active (skip already blocked)
      const result = await this.prisma.user.updateMany({
        where: {
          id: { in: userIdsToBlock },
          status: 'ACTIVE',
          deletedAt: null,
        },
        data: {
          status: 'BLOCKED',
          blockingReason: 'Kitob muddati o\'tganligi sababli avtomatik bloklandi',
        },
      });

      this.logger.log(
        `Auto-block complete: ${result.count} users blocked from ${userIdsToBlock.length} candidates, ${overdueRentals.length} overdue rentals found`,
      );
    } catch (error) {
      this.logger.error(
        `Auto-block cron failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }
}
