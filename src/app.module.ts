import { Module } from '@nestjs/common';
import { PrismaModule } from './modules/prisma/prisma.module';
import { RedisModule } from './modules/redis/redis.module';
import { AuthModule } from './modules/auth/auth.module';
import { RoleModule } from './modules/roles/roles.module';
import { RegionModule } from './modules/regions/regions.module';
import { AddressesModule } from './modules/addresses/addresses.module';
import { LibraryModule } from './modules/libraries/libraries.module';
import { UsersModule } from './modules/users/users.module';
import { AuthorModule } from './modules/authors/authors.module';
import { PublisherModule } from './modules/publishers/publishers.module';
import { CollectionModule } from './modules/collections/collections.module';
import { BooksModule } from './modules/books/books.module';
import { BookEditionModule } from './modules/book-editions/book-editions.module';
import { AuditLogModule } from './modules/audit-log/audit-log.module';
import { StocksModule } from './modules/stocks/stocks.module';
import { CommentsModule } from './modules/comments/comments.module';
import { RentalsModule } from './modules/rentals/rentals.module';
import { FrontAppModule } from './modules/front-app/front-app.module';
import { VerificationModule } from './modules/verification/verification.module';
import { SmsModule } from './modules/sms/sms.module';
import { GatewayModule } from './modules/gateway/gateway.module';
import { WebhookModule } from './modules/webhook/webhook.module';
import { FilesModule } from './modules/files/files.module';
import { StatsModule } from './modules/stats/stats.module';
import { NotificationsModule } from './modules/notifications/notifications.module';

@Module({
  imports: [
    // Core infrastructure
    PrismaModule,
    RedisModule,
    AuthModule,

    // Entity modules
    RoleModule,
    RegionModule,
    AddressesModule,
    LibraryModule,
    UsersModule,
    AuthorModule,
    PublisherModule,
    CollectionModule,
    BooksModule,
    BookEditionModule,
    AuditLogModule,

    // Stock & Rental
    StocksModule,
    CommentsModule,
    RentalsModule,

    // SMS & Communications
    VerificationModule,
    SmsModule,
    GatewayModule,
    WebhookModule,

    // Files
    FilesModule,

    // Stats & Notifications
    StatsModule,
    NotificationsModule,

    // Client-facing APIs
    FrontAppModule,
  ],
})
export class AppModule {}
