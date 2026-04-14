import { Module } from '@nestjs/common';
import { PublisherController } from './publishers.controller';
import { PublisherService } from './publishers.service';

@Module({
  controllers: [PublisherController],
  providers: [PublisherService],
  exports: [PublisherService],
})
export class PublisherModule {}
