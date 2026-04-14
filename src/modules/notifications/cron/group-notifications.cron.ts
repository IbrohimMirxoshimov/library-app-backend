import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

/**
 * Cron jobs for Telegram group notifications.
 *
 * Stub implementation — logs only. Will be fully implemented when
 * notification content/format is finalized.
 *
 * Schedules:
 * - Hourly (10:00-18:00): rental summary to TG group
 * - Daily (19:00): 13-hour daily summary to group
 */
@Injectable()
export class GroupNotificationsCron {
  private readonly logger = new Logger(GroupNotificationsCron.name);

  /** Hourly rent summary to Telegram group (10:00 - 18:00 every day) */
  @Cron('0 10-18 * * *', { name: 'groupHourly' })
  async handleGroupHourly(): Promise<void> {
    this.logger.log('Group hourly notification cron triggered (stub)');
    // TODO: Fetch hourly rental stats and send to TG group
  }

  /** Daily 13-hour summary to group at 19:00 */
  @Cron('0 19 * * *', { name: 'groupDaily' })
  async handleGroupDaily(): Promise<void> {
    this.logger.log('Group daily notification cron triggered (stub)');
    // TODO: Fetch daily rental stats and send to TG group
  }
}
