import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

/**
 * Cron jobs for SMS notifications.
 *
 * Stub implementation — logs only. Will be fully implemented when
 * SMS service integration is finalized.
 *
 * Schedules:
 * - Daily 09:00: create SMS records for expired rentals
 * - Hourly 09:00-22:00: push pending SMS via gateway
 * - Thursday + Sunday 06:00: bulk SMS to overdue users
 */
@Injectable()
export class SmsNotificationsCron {
  private readonly logger = new Logger(SmsNotificationsCron.name);

  /** Create SMS records for expired rentals — daily at 09:00 */
  @Cron('0 9 * * *', { name: 'createExpiredSms' })
  async handleCreateExpiredSms(): Promise<void> {
    this.logger.log('Create expired SMS cron triggered (stub)');
    // TODO: Find expired rentals without SMS, create SMS records
  }

  /** Push pending SMS notifications via gateway — hourly 09:00-22:00 */
  @Cron('0 9-22 * * *', { name: 'pushPendingSms' })
  async handlePushPendingSms(): Promise<void> {
    this.logger.log('Push pending SMS cron triggered (stub)');
    // TODO: Find PENDING SMS, send via gateway/provider
  }

  /** Bulk SMS to overdue users — Thursday and Sunday at 06:00 */
  @Cron('0 6 * * 4,0', { name: 'bulkSms' })
  async handleBulkSms(): Promise<void> {
    this.logger.log('Bulk SMS cron triggered (stub)');
    // TODO: Find users with expired rentals, send bulk SMS
  }
}
