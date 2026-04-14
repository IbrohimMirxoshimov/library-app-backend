import { Module } from '@nestjs/common';
import { CollectionController } from './collections.controller';
import { CollectionService } from './collections.service';

@Module({
  controllers: [CollectionController],
  providers: [CollectionService],
  exports: [CollectionService],
})
export class CollectionModule {}
