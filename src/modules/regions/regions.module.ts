import { Module } from '@nestjs/common';
import { RegionController } from './regions.controller';
import { RegionService } from './regions.service';

@Module({
  controllers: [RegionController],
  providers: [RegionService],
  exports: [RegionService],
})
export class RegionModule {}
