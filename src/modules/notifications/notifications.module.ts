import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TelegramNotificationService } from './telegram-notification.service';
import { AutoBlockCron } from './cron/auto-block.cron';
import { GroupNotificationsCron } from './cron/group-notifications.cron';
import { ChannelNotificationsCron } from './cron/channel-notifications.cron';
import { SmsNotificationsCron } from './cron/sms-notifications.cron';

@Module({
  imports: [ScheduleModule.forRoot()],
  providers: [
    TelegramNotificationService,
    AutoBlockCron,
    GroupNotificationsCron,
    ChannelNotificationsCron,
    SmsNotificationsCron,
  ],
  exports: [TelegramNotificationService],
})
export class NotificationsModule {}
