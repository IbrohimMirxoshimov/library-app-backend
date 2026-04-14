import { Module } from '@nestjs/common';
import { BookEditionController } from './book-editions.controller';
import { BookEditionService } from './book-editions.service';

@Module({
  controllers: [BookEditionController],
  providers: [BookEditionService],
  exports: [BookEditionService],
})
export class BookEditionModule {}
