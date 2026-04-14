import { Module } from '@nestjs/common';
import { BookController } from './books.controller';
import { BookService } from './books.service';

@Module({
  controllers: [BookController],
  providers: [BookService],
  exports: [BookService],
})
export class BooksModule {}
