import { Module } from '@nestjs/common';
import { LibraryController } from './libraries.controller';
import { LibraryService } from './libraries.service';

@Module({
  controllers: [LibraryController],
  providers: [LibraryService],
  exports: [LibraryService],
})
export class LibraryModule {}
