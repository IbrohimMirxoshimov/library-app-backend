import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

/**
 * Cron jobs for Telegram channel notifications.
 *
 * Stub implementation — logs only. Will be fully implemented when
 * notification content/format is finalized.
 *
 * Schedules:
 * - Sunday 08:00: expired rents warning to main channel
 * - Friday 10:00: weekly stats to main channel
 * - 1st of month 10:05: monthly stats to channel
 * - 1st of month 13:05: monthly top readers to channel
 * - Friday 08:00: happy Friday message
 * - Daily 19:00: donation stats
 * - Friday 09:00: weekly donation stats
 * - 1st of month 10:00: monthly donation stats + top readers
 */
@Injectable()
export class ChannelNotificationsCron {
  private readonly logger = new Logger(ChannelNotificationsCron.name);

  /** Expired rents warning — Sunday 08:00 */
  @Cron('0 8 * * 0', { name: 'sundayWarning' })
  async handleSundayWarning(): Promise<void> {
    this.logger.log('Sunday expired rents warning cron triggered (stub)');
    // TODO: Find expired rentals and send warning to main channel
  }

  /** Weekly stats — Friday 10:00 */
  @Cron('0 10 * * 5', { name: 'fridayStats' })
  async handleFridayStats(): Promise<void> {
    this.logger.log('Friday weekly stats cron triggered (stub)');
    // TODO: Compile weekly stats and send to main channel
  }

  /** Monthly stats — 1st of month at 10:05 */
  @Cron('5 10 1 * *', { name: 'monthlyStats' })
  async handleMonthlyStats(): Promise<void> {
    this.logger.log('Monthly stats cron triggered (stub)');
    // TODO: Compile monthly stats and send to channel
  }

  /** Monthly top readers — 1st of month at 13:05 */
  @Cron('5 13 1 * *', { name: 'monthlyTopReaders' })
  async handleMonthlyTopReaders(): Promise<void> {
    this.logger.log('Monthly top readers cron triggered (stub)');
    // TODO: Get top readers and send to channel
  }

  /** Happy Friday message — Friday 08:00 */
  @Cron('0 8 * * 5', { name: 'happyFriday' })
  async handleHappyFriday(): Promise<void> {
    this.logger.log('Happy Friday cron triggered (stub)');
    // TODO: Send happy Friday message to main channel
  }

  /** Daily donation stats — 19:00 */
  @Cron('0 19 * * *', { name: 'donationDaily' })
  async handleDonationDaily(): Promise<void> {
    this.logger.log('Daily donation stats cron triggered (stub)');
    // TODO: Send daily donation stats to donation channel
  }

  /** Weekly donation stats — Friday 09:00 */
  @Cron('0 9 * * 5', { name: 'donationWeekly' })
  async handleDonationWeekly(): Promise<void> {
    this.logger.log('Weekly donation stats cron triggered (stub)');
    // TODO: Send weekly donation stats to donation channel
  }

  /** Monthly donation stats + top readers — 1st of month at 10:00 */
  @Cron('0 10 1 * *', { name: 'donationMonthly' })
  async handleDonationMonthly(): Promise<void> {
    this.logger.log('Monthly donation stats cron triggered (stub)');
    // TODO: Send monthly donation stats + top readers to donation channel
  }
}
