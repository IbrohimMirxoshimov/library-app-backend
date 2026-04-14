import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { getConfig } from '../../config';
import { FrontAuthController } from './controllers/front-auth.controller';
import { FrontBooksController } from './controllers/front-books.controller';
import { FrontAccountController } from './controllers/front-account.controller';
import { FrontStatsController } from './controllers/front-stats.controller';
import { FrontOtherController } from './controllers/front-other.controller';
import { FrontAuthService } from './services/front-auth.service';
import { FrontBooksService } from './services/front-books.service';
import { FrontAccountService } from './services/front-account.service';
import { FrontStatsService } from './services/front-stats.service';

const config = getConfig();

@Module({
  imports: [
    JwtModule.register({
      secret: config.jwt.secret,
      signOptions: { expiresIn: config.jwt.expiresIn as `${number}d` },
    }),
  ],
  controllers: [
    FrontAuthController,
    FrontBooksController,
    FrontAccountController,
    FrontStatsController,
    FrontOtherController,
  ],
  providers: [
    FrontAuthService,
    FrontBooksService,
    FrontAccountService,
    FrontStatsService,
  ],
})
export class FrontAppModule {}
